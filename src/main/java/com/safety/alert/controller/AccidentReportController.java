package com.safety.alert.controller;

import com.safety.alert.model.AccidentReport;
import com.safety.alert.service.AlertPriorityService;
import com.safety.alert.service.EmailService;
import com.safety.alert.repository.AccidentReportRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/accidents")
@CrossOrigin(origins = "*") // Allow frontend access
public class AccidentReportController {

    private final AlertPriorityService service;
    private final AccidentReportRepository repository;
    private final EmailService emailService;
    private final com.safety.alert.repository.UserRepository userRepository;

    public AccidentReportController(AlertPriorityService service, AccidentReportRepository repository,
            EmailService emailService, com.safety.alert.repository.UserRepository userRepository) {
        this.service = service;
        this.repository = repository;
        this.emailService = emailService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<AccidentReport> createReport(@RequestBody AccidentReport report) {
        return ResponseEntity.ok(service.saveAndBroadcast(report));
    }

    @GetMapping
    public ResponseEntity<List<AccidentReport>> getAllReports() {
        return ResponseEntity.ok(repository.findAll());
    }

    @PatchMapping("/{id}")
    public ResponseEntity<AccidentReport> updateReport(@PathVariable java.util.UUID id,
            @RequestBody AccidentReport updates) {
        return repository.findById(id).map(report -> {
            if (updates.getStatus() != null) {
                if ("RESOLVED".equals(updates.getStatus()) && !"RESOLVED".equals(report.getStatus())) {
                    emailService.sendResolvedNotification(report.getTitle(), report.getReporterEmail());
                }
                report.setStatus(updates.getStatus());
            }
            if (updates.getAssignedTo() != null)
                report.setAssignedTo(updates.getAssignedTo());
            if (updates.getDueDate() != null)
                report.setDueDate(updates.getDueDate());

            // Allow basic field updates too if needed
            if (updates.getDescription() != null)
                report.setDescription(updates.getDescription());
            if (updates.getTitle() != null)
                report.setTitle(updates.getTitle());
            if (updates.getSeverity() != null)
                report.setSeverity(updates.getSeverity());
            if (updates.getReporterName() != null)
                report.setReporterName(updates.getReporterName());

            if (updates.getAttachmentUrl() != null)
                report.setAttachmentUrl(updates.getAttachmentUrl());

            return ResponseEntity.ok(service.saveAndBroadcast(report));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<AccidentReport> addComment(@PathVariable java.util.UUID id,
            @RequestBody com.safety.alert.model.Comment comment,
            @RequestHeader(value = "Authorization", required = false) String token) {
        return repository.findById(id).map(report -> {
            comment.setReport(report);

            // Token Parsing to get Author Email
            String userEmail = "";
            String userRole = "VIEWER";
            String userId = "";

            if (token != null && token.startsWith("Bearer ")) {
                String jwt = token.substring(7);
                if (jwt.startsWith("mock-jwt-")) {
                    String remainder = jwt.substring("mock-jwt-".length());
                    int lastDashIndex = remainder.lastIndexOf('-');
                    if (lastDashIndex > 0) {
                        userId = remainder.substring(0, lastDashIndex);
                        userRole = remainder.substring(lastDashIndex + 1);
                    }
                }
            }

            if (!userId.isEmpty()) {
                try {
                    java.util.UUID uid = java.util.UUID.fromString(userId);
                    userEmail = userRepository.findById(uid)
                            .map(com.safety.alert.model.User::getEmail)
                            .orElse("");
                } catch (Exception e) {
                }
            }

            // Set fields
            if (!userEmail.isEmpty()) {
                comment.setAuthorEmail(userEmail);
                if (comment.getAuthor() == null || comment.getAuthor().isEmpty()) {
                    comment.setAuthor(userEmail); // Use email as name if name missing
                }
            } else {
                if (comment.getAuthor() == null)
                    comment.setAuthor("System User");
                if (comment.getAuthorEmail() == null)
                    comment.setAuthorEmail("");
            }
            // For Safety: if frontend sent author name, we keep it, but ensure Email
            // matches token user.
            if (!userEmail.isEmpty()) {
                comment.setAuthorEmail(userEmail);
            }
            report.getComments().add(comment);
            return ResponseEntity.ok(service.saveAndBroadcast(report));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReport(@PathVariable java.util.UUID id,
            @RequestHeader(value = "Authorization", required = false) String token) {

        // Manual Mock Token Parsing (Since SecurityContext is empty)
        String userRole = "VIEWER";
        String userId = "";

        if (token != null && token.startsWith("Bearer ")) {
            String jwt = token.substring(7);
            if (jwt.startsWith("mock-jwt-")) {
                // Format: mock-jwt-<UUID>-<ROLE>
                String[] parts = jwt.split("-");
                if (parts.length >= 4) {
                    userRole = parts[parts.length - 1]; // Last part is Role
                    // Extract ID parts. mock-jwt-UIDPART1-UIDPART2...-ROLE is risky if UUID has
                    // dashes.
                    // UUID has 5 groups: 8-4-4-4-12.
                    // Token format: mock-jwt-<UUID_STRING>-<ROLE>
                    // UUID string itself has hyphens.
                    // Split by "mock-jwt-" prefix first?
                    String remainder = jwt.substring("mock-jwt-".length());
                    int lastDashIndex = remainder.lastIndexOf('-');
                    if (lastDashIndex > 0) {
                        userId = remainder.substring(0, lastDashIndex);
                        userRole = remainder.substring(lastDashIndex + 1);
                    }
                }
            }
        }

        final String finalUserRole = userRole;
        final String finalUserId = userId;

        return repository.findById(id).map(report -> {
            boolean isAdmin = "ADMIN".equals(finalUserRole);
            boolean isAuthor = false;

            if (!isAdmin && !finalUserId.isEmpty()) {
                // Lookup User Email
                try {
                    java.util.UUID uid = java.util.UUID.fromString(finalUserId);
                    isAuthor = userRepository.findById(uid)
                            .map(u -> u.getEmail().equals(report.getReporterEmail()))
                            .orElse(false);
                } catch (Exception e) {
                    // Invalid UUID in token
                }
            }

            if (isAdmin || isAuthor) {
                repository.delete(report);
                return ResponseEntity.ok().build();
            }

            return ResponseEntity.status(403).body("Unauthorized");
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{reportId}/comments/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable java.util.UUID reportId,
            @PathVariable java.util.UUID commentId,
            @RequestHeader(value = "Authorization", required = false) String token) {

        // Manual Mock Token Parsing
        String userRole = "VIEWER";
        String userId = "";

        if (token != null && token.startsWith("Bearer ")) {
            String jwt = token.substring(7);
            if (jwt.startsWith("mock-jwt-")) {
                String remainder = jwt.substring("mock-jwt-".length());
                int lastDashIndex = remainder.lastIndexOf('-');
                if (lastDashIndex > 0) {
                    userId = remainder.substring(0, lastDashIndex);
                    userRole = remainder.substring(lastDashIndex + 1);
                }
            }
        }

        final String finalUserRole = userRole;
        final String finalUserId = userId;

        return repository.findById(reportId).map(report -> {
            com.safety.alert.model.Comment comment = report.getComments().stream()
                    .filter(c -> c.getId().equals(commentId))
                    .findFirst()
                    .orElse(null);

            if (comment == null)
                return ResponseEntity.notFound().build();

            boolean isAdmin = "ADMIN".equals(finalUserRole);
            boolean isAuthor = false;

            if (!isAdmin && !finalUserId.isEmpty()) {
                try {
                    java.util.UUID uid = java.util.UUID.fromString(finalUserId);
                    isAuthor = userRepository.findById(uid)
                            .map(u -> u.getEmail().equals(comment.getAuthorEmail()))
                            .orElse(false);
                } catch (Exception e) {
                }
            }

            if (isAdmin || isAuthor) {
                report.getComments().remove(comment);
                service.saveAndBroadcast(report);
                return ResponseEntity.ok().build();
            } else {
                return ResponseEntity.status(403).body("Unauthorized");
            }
        }).orElse(ResponseEntity.notFound().build());
    }
}
