package com.StarsFighters.StarsFighters.Repositories;

import com.StarsFighters.StarsFighters.Models.Entities.Character;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CharacteRepo extends JpaRepository<Character, Long> {
}
