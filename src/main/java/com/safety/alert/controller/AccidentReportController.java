package com.safety.alert.controller;

import com.safety.alert.model.AccidentReport;
import com.safety.alert.service.AlertPriorityService;
import com.safety.alert.repository.AccidentReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/accidents")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Allow frontend access
public class AccidentReportController {

    private final AlertPriorityService service;
    private final AccidentReportRepository repository;

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
            if (updates.getStatus() != null)
                report.setStatus(updates.getStatus());
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

            return ResponseEntity.ok(service.saveAndBroadcast(report));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<AccidentReport> addComment(@PathVariable java.util.UUID id,
            @RequestBody com.safety.alert.model.Comment comment) {
        return repository.findById(id).map(report -> {
            comment.setReport(report);
            if (comment.getAuthor() == null)
                comment.setAuthor("System User"); // Default author
            report.getComments().add(comment);
            return ResponseEntity.ok(service.saveAndBroadcast(report));
        }).orElse(ResponseEntity.notFound().build());
    }
}
