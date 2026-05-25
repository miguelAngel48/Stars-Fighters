package com.StarsFighters.StarsFighters.Controllers;

import com.StarsFighters.StarsFighters.Services.StoreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<?> addCosmetic(@RequestBody Map<String, Object> payload, Principal principal) {
        try {
            String name = (String) payload.get("name");
            int price = Integer.parseInt(payload.get("price").toString());
            String imageUrl = (String) payload.get("imageUrl");
            storeService.addCosmetic(principal.getName(), name, price, imageUrl);
            return ResponseEntity.ok(Map.of("message", "Producto añadido a la tienda"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}