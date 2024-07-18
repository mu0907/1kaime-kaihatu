// 初期化時に動作するコード
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
    // 初回インストール時のルールセットの有効化
    chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: ['ruleset_1']
    }, () => {
      console.log('Adblock rules enabled');
    });
  });
  
  // タブの更新時に動作するコード
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
      console.log(`Tab updated: ${tab.url}`);
    }
  });
  
  // メッセージリスナー
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'fetchWeather') {
      fetchWeatherData(message.lat, message.lon).then(weatherData => {
        sendResponse(weatherData);
      });
      return true; // 非同期で応答するためにtrueを返す
    } else if (message.type === 'toggleAdBlocker') {
      toggleAdBlocker().then(status => {
        sendResponse(status);
      });
      return true; // 非同期で応答するためにtrueを返す
    }
  });
  
  // 天気データを取得する関数
  async function fetchWeatherData(lat, lon) {
    const apiKey = 'YOUR_OPENWEATHERMAP_API_KEY'; // OpenWeatherMapのAPIキーを入力
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
    const data = await response.json();
    return { temperature: data.main.temp, description: data.weather[0].description };
  }
  
  // 広告ブロッカーの状態を切り替える関数
  async function toggleAdBlocker() {
    // ルールセットの現在の状態を取得
    const rulesetStatus = await chrome.declarativeNetRequest.getEnabledRulesets();
    // 有効化されているかどうかを確認
    const isEnabled = rulesetStatus.includes('ruleset_1');
    if (isEnabled) {
      // 無効化
      await chrome.declarativeNetRequest.updateEnabledRulesets({ disableRulesetIds: ['ruleset_1'] });
      return { status: 'disabled' };
    } else {
      // 有効化
      await chrome.declarativeNetRequest.updateEnabledRulesets({ enableRulesetIds: ['ruleset_1'] });
      return { status: 'enabled' };
    }
  }
  