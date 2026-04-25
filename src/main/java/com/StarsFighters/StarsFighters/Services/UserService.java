package com.StarsFighters.StarsFighters.Services;

import com.StarsFighters.StarsFighters.Models.DAOs.CreateUser;
import com.StarsFighters.StarsFighters.Models.Entities.User;
import com.StarsFighters.StarsFighters.Repositories.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    @Autowired
    UserRepo userRepo;

    public void registUser(CreateUser newUser){

        if (userRepo.existsByEmail(newUser.email())) {
            throw new RuntimeException("El email ya está registrado");
        }
            User user = new User();
            user.setEmail(newUser.email());
            user.setUsername(newUser.username());
            user.setPassword(newUser.password());
            userRepo.save(user);

    }
}
