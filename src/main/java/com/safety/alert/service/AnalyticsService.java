package com.safety.alert.service;

import com.safety.alert.model.AccidentReport;
import com.safety.alert.repository.AccidentReportRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final AccidentReportRepository repository;

    public AnalyticsService(AccidentReportRepository repository) {
        this.repository = repository;
    }

    public Map<String, Object> getDashboardStats() {
        List<AccidentReport> allReports = repository.findAll();

        Map<String, Object> stats = new HashMap<>();

        // 1. Counts by Severity (Convert Enum to String)
        Map<String, Long> severityCounts = allReports.stream()
                .collect(Collectors.groupingBy(r -> r.getSeverity().toString(), Collectors.counting()));
        stats.put("severityCounts", severityCounts);

        // 2. Total Open/Resolved
        long openCount = allReports.stream().filter(r -> "OPEN".equals(r.getStatus())).count();
        long resolvedCount = allReports.stream().filter(r -> "RESOLVED".equals(r.getStatus())).count();
        stats.put("statusCounts", Map.of("OPEN", openCount, "RESOLVED", resolvedCount));

        // 3. Activity (Reports per Day - Last 7 Days)
        LocalDate sevenDaysAgo = LocalDate.now().minusDays(7);
        Map<String, Long> activity = allReports.stream()
                .filter(r -> r.getTimestamp() != null)
                .map(r -> r.getTimestamp().toLocalDate())
                .filter(date -> date.isAfter(sevenDaysAgo))
                .collect(Collectors.groupingBy(LocalDate::toString, Collectors.counting()));
        stats.put("activity", activity);

        return stats;
    }
}
