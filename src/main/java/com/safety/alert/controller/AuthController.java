package com.safety.alert.controller;

import com.safety.alert.model.Role;
import com.safety.alert.model.User;
import com.safety.alert.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserRepository userRepository;
    private final org.springframework.mail.javamail.JavaMailSender mailSender;

    public AuthController(UserRepository userRepository, org.springframework.mail.javamail.JavaMailSender mailSender) {
        this.userRepository = userRepository;
        this.mailSender = mailSender;
    }

    // TODO: Integrate actual JWT Service later. returning mock token for now.

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String password = payload.get("password"); // In real app, hash this!
        String roleStr = payload.get("role");

        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body("Email already used");
        }

        User user = new User(email, password, Role.valueOf(roleStr));
        String code = UUID.randomUUID().toString().substring(0, 6);
        user.setVerificationCode(code);
        userRepository.save(user);

        // Send Email
        try {
            org.springframework.mail.SimpleMailMessage message = new org.springframework.mail.SimpleMailMessage();
            message.setTo(email);
            message.setSubject("ResQ Verification Code");
            message.setText("Your verification code is: " + code);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("FAILED TO SEND EMAIL: " + e.getMessage());
        }

        // DEV ONLY: Log code
        System.out.println("VERIFICATION CODE FOR " + email + ": " + code);

        return ResponseEntity.ok(Map.of("message", "User registered. Check email (or console for dev)."));
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verify(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String code = payload.get("code");

        return userRepository.findByEmail(email).filter(u -> code.equals(u.getVerificationCode())).map(u -> {
            u.setVerified(true);
            u.setVerificationCode(null);
            userRepository.save(u);
            return ResponseEntity.ok((Object) Map.of("message", "Verified!"));
        }).orElse(ResponseEntity.badRequest().body(Map.of("error", "Invalid code or email")));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String password = payload.get("password");

        return userRepository.findByEmail(email).filter(u -> u.getPassword().equals(password)) // In real app, check
                                                                                               // hash
                .filter(User::isVerified).map(u -> {
                    if (!u.isApproved()) {
                        return ResponseEntity.status(403)
                                .body((Object) Map.of("error", "Account pending approval. Please contact Admin."));
                    }
                    // MOCK JWT for initial testing
                    String token = "mock-jwt-" + u.getId() + "-" + u.getRole();
                    return ResponseEntity.ok((Object) Map.of("token", token, "role", u.getRole()));
                }).orElse(ResponseEntity.status(401).body(Map.of("error", "Invalid credentials or not verified")));
    }
}
