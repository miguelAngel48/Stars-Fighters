package com.StarsFighters.StarsFighters.Models.DAOs;

public record CreateUser (
         String username,
         String email,
         String password,
         String checkPassword
){
}
