// 検索機能
const searchInput = document.getElementById('search');
const searchButton = document.getElementById('searchBtn');
const searchEngineSelect = document.getElementById('searchEngine');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const searchHistory = document.getElementById('searchHistory');
const openTabsBtn = document.getElementById('openTabsBtn');
const blockAdsBtn = document.getElementById('blockAdsBtn');
const summaryBtn = document.getElementById('summaryBtn');
const voiceCommandBtn = document.getElementById('voiceCommandBtn');
const loginBtn = document.getElementById('loginBtn');
const userEmail = document.getElementById('userEmail');
const syncBtn = document.getElementById('syncBtn');

let isBlockingAds = false;

// 検索処理を実行する関数
function performSearch() {
  const query = searchInput.value.trim();
  const selectedEngine = searchEngineSelect.value;

  if (query) {
    let searchUrl;

    switch (selectedEngine) {
      case 'google':
        searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        break;
      case 'yahoo':
        searchUrl = `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`;
        break;
      case 'bing':
        searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
        break;
      case 'duckduckgo':
        searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
        break;
      case 'brave':
        searchUrl = `https://search.brave.com/search?q=${encodeURIComponent(query)}`;
        break;
      default:
        searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    }

    chrome.tabs.create({ url: searchUrl });
    saveSearchHistory(query); // 検索履歴にクエリを保存
    displaySearchHistory(); // 検索履歴を更新して表示
  }
}

// 検索ボタンクリックしたときの処理
searchButton.addEventListener('click', performSearch);

// 検索バーでエンターキーが押されたときの処理
searchInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    performSearch();
  }
});

// 検索履歴の保存
function saveSearchHistory(query) {
  chrome.storage.local.get({ searchHistory: [] }, (result) => {
    let history = result.searchHistory;
    history.push(query);
    chrome.storage.local.set({ searchHistory: history });
  });
}

// 検索履歴を表示
function displaySearchHistory() {
  chrome.storage.local.get({ searchHistory: [] }, (result) => {
    const history = result.searchHistory;
    searchHistory.innerHTML = ''; // 既存の履歴をクリア

    if (history.length === 0) {
      searchHistory.innerHTML = '<li>検索履歴はありません</li>';
    } else {
      history.forEach((query) => {
        let listItem = document.createElement('li');
        listItem.textContent = query;
        searchHistory.appendChild(listItem);
      });
    }
  });
}

// ページ読み込み時に検索履歴を表示
document.addEventListener('DOMContentLoaded', displaySearchHistory);

// 検索履歴の消去
clearHistoryBtn.addEventListener('click', () => {
  chrome.storage.local.set({ searchHistory: [] }, () => {
    displaySearchHistory();
  });
});

// タブ管理機能
openTabsBtn.addEventListener('click', () => {
  chrome.tabs.query({}, (tabs) => {
    alert(`現在開いているタブは${tabs.length}個あります。`);
  });
});

// 広告ブロックのトグル
blockAdsBtn.addEventListener('click', () => {
  isBlockingAds = !isBlockingAds;
  if (isBlockingAds) {
    chrome.declarativeNetRequest.updateEnabledRulesets({ enableRulesetIds: ['blockAds'] });
    alert('広告がブロックされました。');
  } else {
    chrome.declarativeNetRequest.updateEnabledRulesets({ disableRulesetIds: ['blockAds'] });
    alert('広告のブロックが解除されました。');
  }
  updateAdBlockButton();
});

function updateAdBlockButton() {
  blockAdsBtn.textContent = isBlockingAds ? '広告のブロックを解除' : '広告をブロック';
  blockAdsBtn.style.backgroundColor = isBlockingAds ? 'red' : '#007bff';
}

// 初期設定を適用
updateAdBlockButton();

// ページの概要機能を実装
summaryBtn.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: summarizePageContent
    });
  });
});

function summarizePageContent() {
  // ページのテキストコンテンツを取得
  let pageText = document.body.innerText;

  // テキストを文単位で分割して最初の5文を取得
  let sentences = pageText.split('.').slice(0, 5).join('. ') + '.';

  // 概要を表示
  alert("ページの概要:\n" + sentences);
}

// 音声認識機能
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SpeechRecognition) {
  alert("お使いのブラウザは音声認識をサポートしていません。");
} else {
  const recognition = new SpeechRecognition();
  recognition.lang = 'ja-JP'; // 日本語対応
  recognition.continuous = false;

  voiceCommandBtn.addEventListener('click', () => {
    recognition.start();
  });

  recognition.onresult = (event) => {
    let speechResult = event.results[0][0].transcript;
    console.log('ユーザーの発言: ', speechResult);

    if (speechResult.includes('ニュース')) {
      chrome.tabs.create({ url: 'https://news.google.com/' });
    } else if (speechResult.includes('ウェブサイトを開いて')) {
      let website = prompt('開きたいウェブサイトを入力してください:');
      if (website) chrome.tabs.create({ url: `https://${website}` });
    } else if (speechResult.includes('履歴からおすすめ')) {
      chrome.history.search({ text: '', maxResults: 10 }, (historyItems) => {
        let suggestions = [];
        historyItems.forEach((item) => {
          if (item.url.includes('technology') || item.title.includes('technology')) {
            suggestions.push(item.url);
          }
        });
        if (suggestions.length > 0) {
          alert('おすすめのページ:\n' + suggestions.join('\n'));
        } else {
          alert('おすすめのページが見つかりませんでした。');
        }
      });
    } else {
      console.log('一致するコマンドが見つかりませんでした。');
    }
  };

  recognition.onerror = (event) => {
    console.error('音声認識エラーが検出されました: ' + event.error);
    alert('音声認識中にエラーが発生しました: ' + event.error);
  };

  recognition.onend = () => {
    console.log('音声認識サービスが切断されました');
  };
}

// ユーザーアカウントでログイン
function loginWithGoogle() {
  chrome.identity.getAuthToken({ interactive: true }, (token) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      alert('ログインに失敗しました。');
      return;
    }
    fetchUserProfile(token);
  });
}

function fetchUserProfile(token) {
  fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then(response => response.json())
    .then(userInfo => {
      userEmail.textContent = `ログイン中: ${userInfo.email}`;
    })
    .catch(error => {
      console.error('ユーザープロフィールの取得に失敗しました:', error);
    });
}

loginBtn.addEventListener('click', loginWithGoogle);

// 検索履歴の同期
function saveHistoryToGoogleDrive(history) {
  chrome.identity.getAuthToken({ interactive: true }, (token) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      alert('同期に失敗しました。');
      return;
    }

    const metadata = {
      name: 'searchHistory.json',
      mimeType: 'application/json'
    };

    const fileContent = JSON.stringify(history);
    const file = new Blob([fileContent], { type: 'application/json' });

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: form
    })
      .then(response => response.json())
      .then(fileInfo => {
        console.log('検索履歴がGoogle Driveに保存されました:', fileInfo);
        alert('検索履歴が同期されました。');
      })
      .catch(error => {
        console.error('検索履歴の保存に失敗しました:', error);
        alert('検索履歴の同期に失敗しました。');
      });
  });
}

syncBtn.addEventListener('click', () => {
  chrome.storage.local.get({ searchHistory: [] }, (result) => {
    saveHistoryToGoogleDrive(result.searchHistory);
  });
});

// 検索履歴の保存（暗号化版）
function saveSearchHistory(query) {
  chrome.storage.local.get({ searchHistory: [] }, (result) => {
    let history = result.searchHistory;
    const encryptedQuery = btoa(query); // Base64エンコード（簡易暗号化）
    history.push(encryptedQuery);
    chrome.storage.local.set({ searchHistory: history });
  });
}

// 検索履歴を表示（復号化版）
function displaySearchHistory() {
  chrome.storage.local.get({ searchHistory: [] }, (result) => {
    const history = result.searchHistory;
    searchHistory.innerHTML = ''; // 既存の履歴をクリア

    if (history.length === 0) {
      searchHistory.innerHTML = '<li>検索履歴はありません</li>';
    } else {
      history.forEach((encodedQuery) => {
        let query = atob(encodedQuery); // Base64デコード
        let listItem = document.createElement('li');
        listItem.textContent = query;
        searchHistory.appendChild(listItem);
      });
    }
  });
}
