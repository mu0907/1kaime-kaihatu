// DOM要素の取得
const homeButton = document.getElementById('homeButton');
const weatherButton = document.getElementById('weatherButton');
const chatButton = document.getElementById('chatButton');
const adBlockButton = document.getElementById('adBlockButton');
const weatherScreenButton = document.getElementById('weatherScreenButton');
const chatScreenButton = document.getElementById('chatScreenButton');
const adblockScreenButton = document.getElementById('adblockScreenButton');
const getWeatherButton = document.getElementById('getWeather');
const chatInput = document.getElementById('chatInput');
const toggleAdBlockerButton = document.getElementById('toggleAdBlocker');
const homeContent = document.getElementById('homeContent');
const weatherContent = document.getElementById('weatherContent');
const chatContent = document.getElementById('chatContent');
const adblockContent = document.getElementById('adblockContent');
const weatherDiv = document.getElementById('weather');
const chatMessages = document.getElementById('chatMessages');
const adblockStatus = document.getElementById('adblockStatus');
const searchInput = document.getElementById('searchInput');
const newsFeed = document.getElementById('newsFeed');
let currentScreen = homeContent;

// 画面表示の切り替え関数
function showContent(content) {
  currentScreen.classList.remove('active');
  content.classList.add('active');
  currentScreen = content;
}

// イベントリスナーの追加
homeButton.addEventListener('click', () => {
  showContent(homeContent);
});
weatherButton.addEventListener('click', () => {
  showContent(weatherContent);
});
chatButton.addEventListener('click', () => {
  showContent(chatContent);
});
adBlockButton.addEventListener('click', () => {
  showContent(adblockContent);
});

// 天気情報の取得
getWeatherButton.addEventListener('click', () => {
  navigator.geolocation.getCurrentPosition(async (position) => {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    const apiKey = 'YOUR_OPENWEATHERMAP_API_KEY'; // OpenWeatherMapのAPIキーを入力
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
    const data = await response.json();
    weatherDiv.innerHTML = `Current temperature: ${data.main.temp}°C`;
  });
});

// ChatGPTのチャットメッセージ送信
chatInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    const message = chatInput.value;
    chatMessages.innerHTML += `<div>${message}</div>`;
    chatInput.value = '';
    // ChatGPT API呼び出し
    fetch('https://api.openai.com/v1/engines/davinci-codex/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `` // OpenAIのAPIキーを入力
      },
      body: JSON.stringify({ prompt: message, max_tokens: 150 })
    })
      .then(response => response.json())
      .then(data => {
        chatMessages.innerHTML += `<div>${data.choices[0].text}</div>`;
      });
  }
});

// 広告ブロックの切り替え
toggleAdBlockerButton.addEventListener('click', () => {
  chrome.declarativeNetRequest.updateEnabledRulesets({
    disableRulesetIds: ['ruleset_1'],
    enableRulesetIds: ['ruleset_1']
  });
  adblockStatus.innerHTML = 'Ad Blocker toggled';
});

// ショートカット機能
function openShortcut(url) {
  chrome.tabs.create({ url });
}

// ニュースフィードの表示
async function fetchNews() {
  const rssFeeds = [
    'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', // NYTimesのRSSフィード
    'https://rss.cnn.com/rss/edition.rss' // CNNのRSSフィード
  ];
  for (const feed of rssFeeds) {
    const response = await fetch(feed);
    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'application/xml');
    const items = xml.querySelectorAll('item');
    items.forEach(item => {
      const title = item.querySelector('title').textContent;
      const link = item.querySelector('link').textContent;
      newsFeed.innerHTML += `<div><a href="${link}" target="_blank">${title}</a></div>`;
    });
  }
}
fetchNews();
