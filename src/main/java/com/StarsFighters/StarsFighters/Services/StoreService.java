package com.StarsFighters.StarsFighters.Services;

import com.StarsFighters.StarsFighters.Models.Entities.Cosmetic;
import com.StarsFighters.StarsFighters.Models.Entities.User;
import com.StarsFighters.StarsFighters.Repositories.CosmeticRepo;
import com.StarsFighters.StarsFighters.Repositories.UserRepo;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
public class StoreService {

    @Autowired
    private CosmeticRepo cosmeticRepo;

    @Autowired
    private UserRepo userRepo;

    private final String UPLOAD_DIR = "frontend/Stars Fighters/public/default/";

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

        if (user.getCoins() < cosmetic.getPrice()) {
            throw new RuntimeException("No tienes suficientes monedas");
        }

        user.setCoins(user.getCoins() - cosmetic.getPrice());
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
    public void addCosmetic(String username, String name, int price, String type, MultipartFile imageFile) throws IOException {
        User user = userRepo.findByUsername(username).orElseThrow();
        if (!"ADMIN".equals(user.getRole())) {
            throw new RuntimeException("No tienes permisos para crear cosméticos");
        }

        if (imageFile.isEmpty()) {
            throw new RuntimeException("El archivo de imagen está vacío");
        }

        String contentType = imageFile.getContentType();
        if (contentType == null || (!contentType.equals("image/jpeg") && !contentType.equals("image/png"))) {
            throw new RuntimeException("Solo se permiten archivos JPG o PNG");
        }

        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String originalFilename = imageFile.getOriginalFilename();
        String fileExtension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        String fileName = UUID.randomUUID().toString() + fileExtension;
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(imageFile.getInputStream(), filePath);

        String fileUrl = "/default/" + fileName;

        Cosmetic cosmetic = new Cosmetic(name, price, fileUrl, type.toUpperCase());
        cosmeticRepo.save(cosmetic);
    }
}