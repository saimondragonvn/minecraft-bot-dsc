const config = require('../config');

class TimeSystem {
  constructor() {
    this.startTime = Date.now();
    this.offsetSeconds = 0; // Để cho phép ngủ nhảy qua ban ngày
  }

  // Lấy tổng số giây đã trôi qua trong chu kỳ
  getCurrentCycleSeconds() {
    const elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000) + this.offsetSeconds;
    return (elapsedSeconds % config.TIME.CYCLE_DURATION_SECONDS + config.TIME.CYCLE_DURATION_SECONDS) % config.TIME.CYCLE_DURATION_SECONDS;
  }

  // Kiểm tra xem hiện tại là Ngày hay Đêm
  isDay() {
    const sec = this.getCurrentCycleSeconds();
    return sec < config.TIME.DAY_DURATION_SECONDS;
  }

  // Lấy giờ Minecraft ảo (từ 06:00 sáng đến 05:59 sáng hôm sau)
  getMinecraftTime() {
    const sec = this.getCurrentCycleSeconds();
    // 1200 giây = 24 giờ Minecraft (1 giờ = 50 giây thực)
    const totalMinutes = Math.floor((sec / config.TIME.CYCLE_DURATION_SECONDS) * 24 * 60);
    // 0 giây thực = 06:00 AM Minecraft (bình minh)
    const currentTotalMinutes = (totalMinutes + 6 * 60) % (24 * 60);
    const hours = Math.floor(currentTotalMinutes / 60);
    const minutes = Math.floor(currentTotalMinutes % 60);

    const padH = hours < 10 ? '0' + hours : hours;
    const padM = minutes < 10 ? '0' + minutes : minutes;

    const isDayTime = this.isDay();
    return {
      timeString: `${padH}:${padM}`,
      isDay: isDayTime,
      icon: isDayTime ? config.EMOJIS.SUN : config.EMOJIS.MOON,
      title: isDayTime ? 'Ban Ngày ☀️' : 'Ban Đêm 🌙',
      description: isDayTime
        ? '☀️ Mặt trời đang chiếu rọi khắp nơi. Động vật ôn hòa nhởn nhơ gặm cỏ, quái vật Overworld bốc cháy ngoài trời nắng!'
        : '🌙 Màn đêm buông xuống! Bóng tối bao trùm, lũ Zombie đói khát, Skeleton thiện xạ và Creeper nổ tung đang rình rập khắp nơi!'
    };
  }

  // Bỏ qua đêm (Ngủ qua ngày mới)
  skipToDay() {
    const sec = this.getCurrentCycleSeconds();
    if (sec >= config.TIME.DAY_DURATION_SECONDS) {
      // Đang ban đêm, cộng thêm giây để tiến thẳng về 0s (06:00 sáng)
      const remainingNight = config.TIME.CYCLE_DURATION_SECONDS - sec;
      this.offsetSeconds += remainingNight;
      return true;
    }
    return false;
  }
}

module.exports = new TimeSystem();
