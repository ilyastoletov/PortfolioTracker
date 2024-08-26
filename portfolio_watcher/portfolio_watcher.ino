#include <ESP8266WiFi.h>
#include <GSON.h>
#include <ESP8266HTTPClient.h>

/* ----- Connection Preferences ----- */
static char ssid[] = "";
static char pass[] = "";
static char url[] = "";

struct Page {
  char coin;
  int priceUSD;
  double volume;
  int volumeUSD;
};

void setup() {
  Serial.begin(9600);
  bool result = connectToWiFi(ssid, pass);
  String response; 
  makeRequest(&response);
  struct Page pages[1];
  parseJSON(response.c_str(), pages);
}

void parseJSON(const char * source, struct Page * result) {
  gson::Parser parser;
  parser.parse(source);
  int size = parser.size();
  Serial.println(size);
}

bool connectToWiFi(char ssid[], char pass[]) {
  Serial.print(F("Connecting to "));
  Serial.print(ssid);

  WiFi.begin(ssid, pass);
  int tries = 0;
  while(WiFi.status() != WL_CONNECTED) {
    if (tries == 20) {
      return false;
    }
    delay(500);
    Serial.print(".");
    tries++;
  }

  Serial.println(F("Connected!"));
  return true;
}

bool makeRequest(String * response) {
  WiFiClient client;
  HTTPClient http;
  http.begin(client, url);
  int status = http.GET();
  Serial.println(F("Connecting to server..."));
  if (status > 0) {
    Serial.printf("Success! Response code: %d\n", status);
    response->concat(http.getString());
  } else {
    Serial.printf("Error. Code: %d\n", status);
  }
  return status > 0;
}

void loop() {
  
}