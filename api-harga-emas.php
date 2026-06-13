<?php

header('Content-Type: application/json');

$url = "https://pegadaian.co.id/gold/prices/savings";

$ch = curl_init($url);

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => false,
    CURLOPT_USERAGENT => "Mozilla/5.0"
]);

$response = curl_exec($ch);

curl_close($ch);

echo $response;
