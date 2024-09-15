#include <LiquidCrystal_I2C.h>
#include <WiFi.h>
#include <GSON.h>
#include <HTTPClient.h>

/* ----- Connection Preferences ----- */
static char ssid[] = "";
static char pass[] = "";
static char url[] = "";

// Change LCD address on your own if neccessarry
LiquidCrystal_I2C lcd(0x27, 8, 2);

struct Page {
  String coin;
  String priceUSD;
  String volume;
  String volumeUSD;
};

void setup() {
  Serial.begin(9600);
  lcd.init();
  bool result = connectToWiFi(ssid, pass); 
  String response; 
  bool serverResult = makeRequest(&response); 
  if (!serverResult) {
    Serial.println(F("Not successfull request. Terminating..."));
    return;
  }

  int limit;
  Page* pages = parseJSON(response.c_str(), &limit);
  for (int i = 0; i < limit; i++) {
    lcd.clear();
    displayPage(pages[i]);
    delay(5000);
  }
  free(pages);
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

Page* parseJSON(const char * source, int * limit) {
  gson::Parser parser;
  parser.parse(source);

  gson::Entry currencies = parser.get("currencies");
  int size = currencies.length();
  *limit = size;
  struct Page* pages = (Page*) calloc(size, sizeof(struct Page));

  for (int i = 0; i < size; i++) {
    gson::Entry obj = currencies.get(i);
    struct Page el;

    el.coin = obj.get("name").value().toString();
    el.priceUSD = obj.get("cur_price").value().toString();
    el.volume = obj.get("balance").value().toString();
    el.volumeUSD = obj.get("balance_usd").value().toString();
    
    pages[i] = el;
  }

  parser.reset(); // Free memory used by parser
  return pages;
}

void getWorth(const char * jsonSource, String* btc, String* usd) {
  gson::Parser parser;
  parser.parse(jsonSource);
  btc->concat(parser.get("total_btc").value().toString());
  usd->concat(parser.get("total_usd").value().toString());
  parser.reset();
}


void displayPage(Page p) {
  String shortName = p.coin.substring(0, 3);
  p.priceUSD.concat("$");
  p.volumeUSD.concat("$");

  // lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print(shortName);
  lcd.setCursor(4, 0);
  lcd.print(p.priceUSD);
  lcd.setCursor(11, 0);
  lcd.print(p.volumeUSD);
  lcd.setCursor(0, 1);
  lcd.print("Q:");
  lcd.setCursor(3, 1);
  lcd.print(p.volume);
}

void loop() {
  
}