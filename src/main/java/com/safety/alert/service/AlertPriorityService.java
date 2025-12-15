package com.safety.alert.service;

import com.safety.alert.model.AccidentReport;
import com.safety.alert.repository.AccidentReportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.concurrent.PriorityBlockingQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import jakarta.annotation.PostConstruct;

/**
 * Service to handle alert prioritization and broadcasting.
 * <p>
 * Time Complexity of PriorityQueue operations:
 * - Insertion (offer): O(log n)
 * - Removal (poll): O(log n)
 * <p>
 * This ensures that HIGH severity alerts are processed before others.
 */
@Service
@RequiredArgsConstructor
public class AlertPriorityService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AlertPriorityService.class);

    private final AccidentReportRepository repository;
    private final SimpMessagingTemplate messagingTemplate;

    // Custom Comparator: High Severity first, then earlier timestamps.
    private final Comparator<AccidentReport> priorityComparator = (r1, r2) -> {
        int severityCompare = r1.getSeverity().compareTo(r2.getSeverity()); // HIGH(0) < MEDIUM(1) < LOW(2) ? No, Enum
                                                                            // order is usually declaration order.
        // We want HIGH to come first.
        // If Enum is HIGH, MEDIUM, LOW. ordinal is 0, 1, 2.
        // Smaller ordinal means higher priority in PriorityQueue (min-heap).
        if (severityCompare != 0) {
            return severityCompare;
        }
        // If severity is same, earlier timestamp comes first
        return r1.getTimestamp().compareTo(r2.getTimestamp());
    };

    private final PriorityBlockingQueue<AccidentReport> alertQueue = new PriorityBlockingQueue<>(11,
            priorityComparator);
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @PostConstruct
    public void startProcessing() {
        executor.submit(() -> {
            while (true) {
                try {
                    AccidentReport report = alertQueue.take(); // Blocks until element available
                    processAlert(report);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        });
    }

    public AccidentReport saveAndBroadcast(AccidentReport report) {
        AccidentReport savedReport = repository.save(report);
        // Add to priority queue
        alertQueue.offer(savedReport);
        return savedReport;
    }

    private void processAlert(AccidentReport report) {
        log.info("Processing Alert: {} [Severity: {}]", report.getTitle(), report.getSeverity());
        // Simulate processing delay if needed, or just broadcast
        messagingTemplate.convertAndSend("/topic/alerts", report);
    }
}
