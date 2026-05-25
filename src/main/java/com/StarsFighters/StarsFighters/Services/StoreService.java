package com.StarsFighters.StarsFighters.Services;

import com.StarsFighters.StarsFighters.Models.Entities.Cosmetic;
import com.StarsFighters.StarsFighters.Models.Entities.User;
import com.StarsFighters.StarsFighters.Repositories.CosmeticRepo;
import com.StarsFighters.StarsFighters.Repositories.UserRepo;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StoreService {

    @Autowired
    private CosmeticRepo cosmeticRepo;

    @Autowired
    private UserRepo userRepo;

    public List<Cosmetic> getStoreItems() {
        return cosmeticRepo.findAll();
    }

    public List<Cosmetic> getUserInventory(String username) {
        User user = userRepo.findByUsername(username).orElseThrow();
        return user.getOwnedCosmetics();
    }

    @Transactional
    public void buyCosmetic(String username, Long cosmeticId) {
        User user = userRepo.findByUsername(username).orElseThrow();
        Cosmetic cosmetic = cosmeticRepo.findById(cosmeticId).orElseThrow();

        if (user.getOwnedCosmetics().contains(cosmetic)) {
            throw new RuntimeException("Ya posees este cosmético");
        }

        user.getOwnedCosmetics().add(cosmetic);
        userRepo.save(user);
    }

    @Transactional
    public void equipCosmetic(String username, Long cosmeticId) {
        User user = userRepo.findByUsername(username).orElseThrow();
        Cosmetic cosmetic = cosmeticRepo.findById(cosmeticId).orElseThrow();

        if (!user.getOwnedCosmetics().contains(cosmetic)) {
            throw new RuntimeException("No has comprado este cosmético");
        }

        user.setEquippedAvatarUrl(cosmetic.getImageUrl());
        userRepo.save(user);
    }

    @Transactional
    public void addCosmetic(String username, String name, int price, String imageUrl) {
        User user = userRepo.findByUsername(username).orElseThrow();
        if (!"ADMIN".equals(user.getRole())) {
            throw new RuntimeException("No tienes permisos para crear cosméticos");
        }
        Cosmetic cosmetic = new Cosmetic(name, price, imageUrl);
        cosmeticRepo.save(cosmetic);
    }
}