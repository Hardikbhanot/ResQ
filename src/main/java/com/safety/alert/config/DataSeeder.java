package com.safety.alert.config;

import com.safety.alert.model.Role;
import com.safety.alert.model.User;
import com.safety.alert.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner initDatabase(UserRepository userRepository) {
        return args -> {
            if (userRepository.findByEmail("admin@resq.com").isEmpty()) {
                User admin = new User("admin@resq.com", "admin123", Role.ADMIN);
                admin.setVerified(true);
                userRepository.save(admin);
                System.out.println("ADMIN ACCOUNT CREATED: admin@resq.com / admin123");
            }
        };
    }
}
