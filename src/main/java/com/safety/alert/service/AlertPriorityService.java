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

    // Renamed to match Controller usage
    public AccidentReport saveAndBroadcast(AccidentReport report) {
        // 1. Calculate Priority Score/Logic (simplified)
        // Ensure defaults if missing
        if (report.getTimestamp() == null) {
            report.setTimestamp(LocalDateTime.now());
        }
        if (report.getStatus() == null) {
            report.setStatus(AccidentReport.ReportStatus.OPEN);
        }

        // 2. Save
        AccidentReport saved = repository.save(report);

        // 3. Push to WebSocket
        messagingTemplate.convertAndSend("/topic/alerts", saved);

        // 4. Trigger Email if High Severity
        if (saved.getSeverity() == AccidentReport.Severity.HIGH) {
            emailService.sendHighAlertNotification(
                    saved.getTitle(),
                    saved.getDescription(),
                    saved.getSeverity().toString());
        }

        return saved;
    }

    public List<AccidentReport> getSortedReports() {
        return repository.findAll();
    }

    private int getSeverityWeight(AccidentReport report) {
        if (report.getSeverity() == null)
            return 0;
        switch (report.getSeverity()) {
            case HIGH:
                return 3;
            case MEDIUM:
                return 2;
            case LOW:
                return 1;
            default:
                return 0;
        }
    }
}
