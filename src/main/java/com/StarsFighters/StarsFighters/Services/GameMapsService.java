package com.StarsFighters.StarsFighters.Services;

import com.StarsFighters.StarsFighters.Models.Dto.GameMapsDto;
import com.StarsFighters.StarsFighters.Repositories.GameMapsRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class GameMapsService {

    @Autowired
    private GameMapsRepo gameMapsRepo;

    public List<GameMapsDto> getAllMaps() {
        return gameMapsRepo.findAll().stream()
                .map(m -> new GameMapsDto(
                        m.getId(),
                        m.getName(),
                        m.getDescription(),
                        m.getBackgroundUrl(),
                        m.getGravity()
                ))
                .collect(Collectors.toList());
    }
}