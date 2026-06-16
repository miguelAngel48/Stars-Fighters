package com.StarsFighters.StarsFighters.Components;

import com.StarsFighters.StarsFighters.Models.Entities.User;
import com.StarsFighters.StarsFighters.Repositories.UserRepo;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminInitializer implements CommandLineRunner {

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;

    public AdminInitializer(UserRepo userRepo, PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        if (userRepo.findByUsername("admin").isEmpty()) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setEmail("admin@gmail.com");
            admin.setPassword(passwordEncoder.encode("12345"));
            admin.setRole("ADMIN");
            admin.setLevel(99);
            admin.setFriendCode("#0000-0000");

            userRepo.save(admin);
            System.out.println("✅ Cuenta de Administrador creada con éxito.");
        }
    }
}