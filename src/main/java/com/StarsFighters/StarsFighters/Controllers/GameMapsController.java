package com.StarsFighters.StarsFighters.Controllers;

import com.StarsFighters.StarsFighters.Models.Dto.GameMapsDto;
import com.StarsFighters.StarsFighters.Services.GameMapsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/maps")
public class GameMapsController {

    @Autowired
    private GameMapsService gameMapsService;

    @GetMapping
    public ResponseEntity<List<GameMapsDto>> getMaps() {
        try {
            List<GameMapsDto> maps = gameMapsService.getAllMaps();
            return ResponseEntity.ok(maps);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}