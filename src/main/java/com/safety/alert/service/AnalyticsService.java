package com.safety.alert.service;

import com.safety.alert.model.AccidentReport;
import com.safety.alert.repository.AccidentReportRepository;
import com.safety.alert.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final AccidentReportRepository repository;
    private final UserRepository userRepository;

    public AnalyticsService(AccidentReportRepository repository, UserRepository userRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
    }

    public Map<String, Object> getDashboardStats() {
        List<AccidentReport> allReports = repository.findAll();
        Map<String, Object> stats = new HashMap<>();

        // 1. Counts by Severity
        Map<String, Long> severityCounts = allReports.stream()
                .filter(r -> r.getSeverity() != null)
                .collect(Collectors.groupingBy(r -> r.getSeverity().name(), Collectors.counting()));
        stats.put("severityCounts", severityCounts);

        // 2. Status Counts (Fix: Enum Comparison)
        long openCount = allReports.stream().filter(r -> AccidentReport.ReportStatus.OPEN.equals(r.getStatus()))
                .count();
        long resolvedCount = allReports.stream().filter(r -> AccidentReport.ReportStatus.RESOLVED.equals(r.getStatus()))
                .count();
        stats.put("statusCounts", Map.of("OPEN", openCount, "RESOLVED", resolvedCount));

        // 3. New Metrics
        long totalUsers = userRepository.count();
        long totalReports = allReports.size();
        long urgentCases = allReports.stream()
                .filter(r -> AccidentReport.ReportStatus.OPEN.equals(r.getStatus())
                        && AccidentReport.Severity.HIGH.equals(r.getSeverity()))
                .count();

        stats.put("totalUsers", totalUsers);
        stats.put("totalReports", totalReports);
        stats.put("urgentCases", urgentCases);

        // 4. Activity (Reports per Day - Last 7 Days)
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
