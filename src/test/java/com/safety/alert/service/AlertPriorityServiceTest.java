package com.safety.alert.service;

import com.safety.alert.model.AccidentReport;
import com.safety.alert.repository.AccidentReportRepository;
import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.PriorityBlockingQueue;
import java.lang.reflect.Field;
import org.springframework.data.domain.Example;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.repository.query.FluentQuery;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class AlertPriorityServiceTest {

    // Manual Stub for Repository to avoid Mockito issues with Java 24
    static class StubRepository implements AccidentReportRepository {
        @Override
        public <S extends AccidentReport> S save(S entity) {
            return entity;
        }

        // Implement other methods as no-ops or throw exception if called
        @Override
        public List<AccidentReport> findAll() {
            return null;
        }

        @Override
        public List<AccidentReport> findAll(Sort sort) {
            return null;
        }

        @Override
        public List<AccidentReport> findAllById(Iterable<UUID> ids) {
            return null;
        }

        @Override
        public <S extends AccidentReport> List<S> saveAll(Iterable<S> entities) {
            return null;
        }

        @Override
        public void flush() {
        }

        @Override
        public <S extends AccidentReport> S saveAndFlush(S entity) {
            return null;
        }

        @Override
        public <S extends AccidentReport> List<S> saveAllAndFlush(Iterable<S> entities) {
            return null;
        }

        @Override
        public void deleteAllInBatch(Iterable<AccidentReport> entities) {
        }

        @Override
        public void deleteAllByIdInBatch(Iterable<UUID> ids) {
        }

        @Override
        public void deleteAllInBatch() {
        }

        @Override
        public AccidentReport getOne(UUID id) {
            return null;
        }

        @Override
        public AccidentReport getById(UUID id) {
            return null;
        }

        @Override
        public AccidentReport getReferenceById(UUID id) {
            return null;
        }

        @Override
        public <S extends AccidentReport> List<S> findAll(Example<S> example) {
            return null;
        }

        @Override
        public <S extends AccidentReport> List<S> findAll(Example<S> example, Sort sort) {
            return null;
        }

        @Override
        public Page<AccidentReport> findAll(Pageable pageable) {
            return null;
        }

        @Override
        public Optional<AccidentReport> findById(UUID id) {
            return Optional.empty();
        }

        @Override
        public boolean existsById(UUID id) {
            return false;
        }

        @Override
        public long count() {
            return 0;
        }

        @Override
        public void deleteById(UUID id) {
        }

        @Override
        public void delete(AccidentReport entity) {
        }

        @Override
        public void deleteAllById(Iterable<? extends UUID> ids) {
        }

        @Override
        public void deleteAll(Iterable<? extends AccidentReport> entities) {
        }

        @Override
        public void deleteAll() {
        }

        @Override
        public <S extends AccidentReport> Optional<S> findOne(Example<S> example) {
            return Optional.empty();
        }

        @Override
        public <S extends AccidentReport> Page<S> findAll(Example<S> example, Pageable pageable) {
            return null;
        }

        @Override
        public <S extends AccidentReport> long count(Example<S> example) {
            return 0;
        }

        @Override
        public <S extends AccidentReport> boolean exists(Example<S> example) {
            return false;
        }

        @Override
        public <S extends AccidentReport, R> R findBy(Example<S> example,
                FluentQuery.FetchableFluentQuery<S> queryFunction) {
            return null;
        }
    }

    // Subclass to override processAlert and avoid SimpMessagingTemplate
    static class TestableAlertPriorityService extends AlertPriorityService {
        List<AccidentReport> processed = new ArrayList<>();

        public TestableAlertPriorityService(AccidentReportRepository repository) {
            super(repository, null); // Pass null for messaging template
        }

        @Override // This method is private in original class, checking if I need to change
                  // visibility
        // Wait, processAlert is private. I cannot override it unless I make it
        // protected/package-private.
        // I will change visibility in the main class.
        // Or I can just check the queue directly as before.
        // But saveAndBroadcast calls convertAndSend via processAlert?
        // No, saveAndBroadcast puts in queue.
        // The consumer thread calls processAlert.
        // In the test, I don't start the consumer thread (startProcessing is not
        // called).
        // So the queue just fills up.
        // So I can check the queue directly via reflection.
        // AND validation: passing null for SimpMessagingTemplate is fine IF
        // processAlert is not called.
        // It is NOT called because I don't call startProcessing().
        // So I just need to avoid Mockito entirely.
        public void dummy() {
        }
    }

    @Test
    public void testPriorityQueueLogic() throws Exception {
        StubRepository repository = new StubRepository();
        AlertPriorityService service = new AlertPriorityService(repository, null);

        // Access the private queue via reflection
        Field queueField = AlertPriorityService.class.getDeclaredField("alertQueue");
        queueField.setAccessible(true);
        PriorityBlockingQueue<AccidentReport> queue = (PriorityBlockingQueue<AccidentReport>) queueField.get(service);

        // Create reports
        AccidentReport lowReport = new AccidentReport();
        lowReport.setTitle("Low Report");
        lowReport.setSeverity(AccidentReport.Severity.LOW);
        lowReport.setTimestamp(LocalDateTime.now());

        AccidentReport highReport = new AccidentReport();
        highReport.setTitle("High Report");
        highReport.setSeverity(AccidentReport.Severity.HIGH);
        highReport.setTimestamp(LocalDateTime.now().plusSeconds(1));

        AccidentReport mediumReport = new AccidentReport();
        mediumReport.setTitle("Medium Report");
        mediumReport.setSeverity(AccidentReport.Severity.MEDIUM);
        mediumReport.setTimestamp(LocalDateTime.now().plusSeconds(2));

        // Submit in order: Low, High, Medium
        service.saveAndBroadcast(lowReport);
        service.saveAndBroadcast(highReport);
        service.saveAndBroadcast(mediumReport);

        // Verify Order in Queue (High should be first, then Medium, then Low)
        assertEquals(3, queue.size());
        assertEquals(AccidentReport.Severity.HIGH, queue.poll().getSeverity());
        assertEquals(AccidentReport.Severity.MEDIUM, queue.poll().getSeverity());
        assertEquals(AccidentReport.Severity.LOW, queue.poll().getSeverity());
    }
}
