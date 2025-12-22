package com.safety.alert.service;

import com.safety.alert.model.User;
import com.safety.alert.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private UserRepository userRepository;

    public void sendHighAlertNotification(String title, String description, String severity) {
        List<User> users = userRepository.findAll();

        if (users.isEmpty())
            return;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setSubject("URGENT: " + severity + " ALERT - " + title);
        message.setText("EMERGENCY ALERT SYSTEM\n\n" +
                "Severity: " + severity + "\n" +
                "Title: " + title + "\n" +
                "Description: " + description + "\n\n" +
                "Please check the ResQ Dashboard immediately.");

        // Collect all emails
        String[] emails = users.stream()
                .map(User::getEmail)
                .filter(email -> email != null && !email.isEmpty())
                .toArray(String[]::new);

        if (emails.length > 0) {
            message.setTo(emails);
            // message.setFrom("alerts@resq.com"); // Configured in properties ideally

            try {
                mailSender.send(message);
                System.out.println("Emergency emails sent to " + emails.length + " recipients.");
            } catch (Exception e) {
                System.err.println("Failed to send emails: " + e.getMessage());
            }
        }
    }

    public void sendResolvedNotification(String title, String reporterEmail) {
        if (reporterEmail == null || reporterEmail.isEmpty())
            return;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(reporterEmail);
        message.setSubject("Issue Resolved: " + title);
        message.setText("Good news!\n\nYour reported incident '" + title
                + "' has been marked as RESOLVED by our team.\n\nThank you for helping keep the community safe.\n\n- ResQ Team");

        try {
            mailSender.send(message);
            System.out.println("Resolved email sent to " + reporterEmail);
        } catch (Exception e) {
            System.err.println("Failed to send resolved email: " + e.getMessage());
        }
    }
}
