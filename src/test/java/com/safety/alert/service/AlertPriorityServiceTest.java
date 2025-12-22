package com.safety.alert.service;

import com.safety.alert.model.AccidentReport;
import com.safety.alert.repository.AccidentReportRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AlertPriorityServiceTest {

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private AccidentReportRepository repository;

    @Mock
    private EmailService emailService;

    private AlertPriorityService service;

    @BeforeEach
    void setUp() {
        service = new AlertPriorityService(messagingTemplate, repository, emailService);
    }

    @Test
    public void testSaveAndBroadcast() {
        // Arrange
        AccidentReport report = new AccidentReport();
        report.setTitle("Test Report");
        report.setSeverity(AccidentReport.Severity.HIGH);

        when(repository.save(any(AccidentReport.class))).thenAnswer(i -> i.getArguments()[0]);

        // Act
        AccidentReport saved = service.saveAndBroadcast(report);

        // Assert
        assertNotNull(saved.getTimestamp());
        assertEquals(AccidentReport.ReportStatus.OPEN, saved.getStatus());

        // Verify Repository Save
        verify(repository, times(1)).save(report);

        // Verify WebSocket Push
        verify(messagingTemplate, times(1)).convertAndSend(eq("/topic/alerts"), any(AccidentReport.class));

        // Verify Email Sent (Since HIGH severity)
        verify(emailService, times(1)).sendHighAlertNotification(any(), any(), any());
    }
}
