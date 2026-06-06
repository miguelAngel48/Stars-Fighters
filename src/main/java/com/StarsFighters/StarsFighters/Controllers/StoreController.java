package com.StarsFighters.StarsFighters.Controllers;

import com.StarsFighters.StarsFighters.Services.StoreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/store")
public class StoreController {

    @Autowired
    private StoreService storeService;

    @GetMapping("/items")
    public ResponseEntity<?> getStoreItems() {
        return ResponseEntity.ok(storeService.getStoreItems());
    }

    @GetMapping("/inventory")
    public ResponseEntity<?> getInventory(Principal principal) {
        return ResponseEntity.ok(storeService.getUserInventory(principal.getName()));
    }

    @PostMapping("/buy/{id}")
    public ResponseEntity<?> buyCosmetic(@PathVariable Long id, Principal principal) {
        try {
            storeService.buyCosmetic(principal.getName(), id);
            return ResponseEntity.ok(Map.of("message", "Compra completada con éxito"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/equip/{id}")
    public ResponseEntity<?> equipCosmetic(@PathVariable Long id, Principal principal) {
        try {
            storeService.equipCosmetic(principal.getName(), id);
            return ResponseEntity.ok(Map.of("message", "Foto de perfil equipada"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/admin/items")
    public ResponseEntity<?> addCosmetic(
            @RequestParam("name") String name,
            @RequestParam("price") int price,
            @RequestParam(value = "type", defaultValue = "AVATAR") String type,
            @RequestParam("image") MultipartFile imageFile,
            Principal principal) {
        try {
            storeService.addCosmetic(principal.getName(), name, price, type, imageFile);
            return ResponseEntity.ok(Map.of("message", "Producto añadido a la tienda"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}