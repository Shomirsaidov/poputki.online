// Mock Telegram WebApp for testing
window.Telegram = {
  WebApp: {
    initDataUnsafe: {
      user: {
        id: 987654321,
        first_name: "Mock",
        last_name: "User",
        username: "mockuser123",
        photo_url: "https://ui-avatars.com/api/?name=Mock+User&background=random"
      }
    },
    expand: () => console.log("Telegram WebApp expand called")
  }
};
console.log("Mock Telegram WebApp injected");
