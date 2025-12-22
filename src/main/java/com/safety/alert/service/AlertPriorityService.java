package com.safety.alert.service;

import com.safety.alert.model.AccidentReport;
import com.safety.alert.repository.AccidentReportRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.PriorityQueue;

@Service
public class AlertPriorityService {

    // Priority Queue: Custom comparator based on severity and timestamp
    private final PriorityQueue<AccidentReport> priorityQueue = new PriorityQueue<>(
            Comparator.comparingInt(this::getSeverityWeight).reversed()
                    .thenComparing(AccidentReport::getTimestamp));

    private final SimpMessagingTemplate messagingTemplate;
    private final AccidentReportRepository repository;
    private final EmailService emailService;

    public AlertPriorityService(SimpMessagingTemplate messagingTemplate, AccidentReportRepository repository,
            EmailService emailService) {
        this.messagingTemplate = messagingTemplate;
        this.repository = repository;
        this.emailService = emailService;
    }

    public AccidentReport processReport(AccidentReport report) {
        // 1. Calculate Priority Score (simplified)
        int priority = calculatePriority(report);
        report.setPriorityScore(priority);
        report.setTimestamp(new java.util.Date());
        report.setStatus("OPEN");

        // 2. Save
        AccidentReport saved = repository.save(report);

        // 3. Push to WebSocket
        messagingTemplate.convertAndSend("/topic/alerts", saved);

        // 4. Trigger Email if High Severity
        if ("HIGH".equals(saved.getSeverity())) {
            emailService.sendHighAlertNotification(saved.getTitle(), saved.getDescription(), saved.getSeverity());
        }

        return saved;
    }

    public List<AccidentReport> getSortedReports() {
        return repository.findAll(); // In a real system, you'd sort by priority here
    }

    private int calculatePriority(AccidentReport report) {
        int score = 0;
        switch (report.getSeverity()) {
            case "HIGH":
                score += 100;
                break;
            case "MEDIUM":
                score += 50;
                break;
            case "LOW":
                score += 10;
                break;
        }
        return score;
    }

    private int getSeverityWeight(AccidentReport report) {
        switch (report.getSeverity()) {
            case "HIGH":
                return 3;
            case "MEDIUM":
                return 2;
            case "LOW":
                return 1;
            default:
                return 0;
        }
    }
}
