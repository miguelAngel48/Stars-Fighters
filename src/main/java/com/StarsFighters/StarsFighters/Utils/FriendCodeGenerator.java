package com.StarsFighters.StarsFighters.Utils;

import java.util.Random;

public class FriendCodeGenerator {

    public static String generateCode() {
        Random random = new Random();
        int part1 = random.nextInt(10000);
        int part2 = random.nextInt(10000);

        return String.format("#%04d-%04d", part1, part2);
    }
}