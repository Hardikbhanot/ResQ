package com.safety.alert.controller;

import com.safety.alert.model.Role;
import com.safety.alert.model.User;
import com.safety.alert.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    private final UserRepository userRepository;

    public AdminController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @PatchMapping("/users/{id}/approve")
    public ResponseEntity<?> approveUser(@PathVariable UUID id) {
        return userRepository.findById(id).map(user -> {
            user.setApproved(true);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "User approved"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<?> changeRole(@PathVariable UUID id, @RequestBody Map<String, String> payload) {
        return userRepository.findById(id).map(user -> {
            user.setRole(Role.valueOf(payload.get("role")));
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Role updated"));
        }).orElse(ResponseEntity.notFound().build());
    }
}
