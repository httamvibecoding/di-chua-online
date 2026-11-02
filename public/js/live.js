/**
 * Live 9:16 Client Controller — Chánh Điện Đức Phật A Di Đà & Đạo Tràng Phật Tử Quỳ Lễ
 * - Hiển thị 6 Đệm Quỳ VIP (Top 6 Bảng Vàng Công Đức)
 * - Hiển thị 40 Phật Tử mặc áo lam quỳ hai bên thảm đỏ + thẻ tên người xem
 * - Hiệu ứng người xem bước dọc thảm đỏ lên trước Lư Hương Đồng dâng hương
 * - Giọng đọc ZeroTTS (Mai Chi) + Pháp khí Web Audio
 */
(function () {
  const params = new URLSearchParams(window.location.search);
  if (params.get('obs') === '1') {
    document.body.classList.add('obs-mode');
  }

  // 1. Tự động co giãn khung 1080x1920 vừa khít Stage Wrapper (9:16)
  const stageWrapper = document.getElementById('stageWrapper');
  const stage9x16 = document.getElementById('stage9x16');

  function fitStage() {
    if (!stageWrapper || !stage9x16) return;
    const rect = stageWrapper.getBoundingClientRect();
    const scale = rect.width / 1080;
    stage9x16.style.transform = `scale(${scale})`;
  }
  window.addEventListener('resize', fitStage);
  fitStage();

  // 2. Khởi tạo Particle Engine & Audio Engine (ZeroTTS Mai Chi)
  const canvas = document.getElementById('templeCanvas');
  const particles = new window.TempleParticleEngine(canvas);
  const audio = new window.TempleAudioEngine();

  function unlockAudioOnce() {
    audio.ensureContext();
    const btnUnlock = document.getElementById('btnUnlockAudio');
    if (btnUnlock) {
      btnUnlock.textContent = '✅ Âm Thanh Chùa Đã Sẵn Sàng';
      btnUnlock.classList.remove('gold');
      btnUnlock.classList.add('active-toggle');
    }
  }
  window.addEventListener('pointerdown', unlockAudioOnce, { once: true });

  // 3. Vẽ các nén nhang đang cháy trong Lư Hương Đỉnh Đồng (x=540, y=895)
  const incenseHolder = document.getElementById('incenseSticksHolder');
  let renderedStickCount = 0;

  function renderIncenseSticks(count) {
    const target = Math.max(3, Math.min(27, Number(count) || 9));
    if (target === renderedStickCount && incenseHolder.children.length > 0) return;
    renderedStickCount = target;
    incenseHolder.innerHTML = '';

    const tips = [];
    for (let i = 0; i < target; i++) {
      const stick = document.createElement('div');
      stick.className = 'incense-stick';

      const spread = target === 1 ? 0 : (i / (target - 1) - 0.5) * 2;
      const leftPx = 65 + spread * 28 + Math.sin(i * 2.1) * 2;
      const angleDeg = spread * 12 + Math.cos(i * 1.5) * 1.5;
      const heightPx = 76 + (i % 3) * 6;

      stick.style.left = `${leftPx}px`;
      stick.style.height = `${heightPx}px`;
      stick.style.transform = `rotate(${angleDeg}deg)`;

      const ember = document.createElement('div');
      ember.className = 'incense-ember';
      ember.style.animationDelay = `${(i * 0.15) % 1.1}s`;
      stick.appendChild(ember);
      incenseHolder.appendChild(stick);

      const rad = (angleDeg * Math.PI) / 180;
      const tipX = 540 + (leftPx - 65) + Math.sin(rad) * heightPx;
      const tipY = 895 - Math.cos(rad) * heightPx;
      tips.push({ x: tipX, y: tipY });
    }
    particles.setIncenseTips(tips);
  }

  // 4. Dựng Hàng 6 Đệm Quỳ VIP (Top 6 Thí Chủ trên bục gỗ y=1188)
  const VIP_CUSHION_COORDS = [
    { x: 140, y: 1188, rank: 1 },
    { x: 268, y: 1188, rank: 2 },
    { x: 392, y: 1188, rank: 3 },
    { x: 688, y: 1188, rank: 4 },
    { x: 812, y: 1188, rank: 5 },
    { x: 940, y: 1188, rank: 6 }
  ];

  const MONASTIC_ROBES = ['earth', 'ochre', 'ash', 'moss'];
  const MONASTIC_ORDERS = [
    { key: 'novice', label: 'Ma chú tiểu' },
    { key: 'nun', label: 'Ma ni cô' }
  ];
  const appearanceByViewer = new Map();

  function getMonasticAppearance(identity) {
    const key = String(identity || 'thí chủ hữu duyên').trim().toLocaleLowerCase('vi');
    if (!appearanceByViewer.has(key)) {
      appearanceByViewer.set(key, {
        robe: MONASTIC_ROBES[Math.floor(Math.random() * MONASTIC_ROBES.length)],
        ...MONASTIC_ORDERS[Math.floor(Math.random() * MONASTIC_ORDERS.length)]
      });
      if (appearanceByViewer.size > 500) {
        appearanceByViewer.delete(appearanceByViewer.keys().next().value);
      }
    }
    return appearanceByViewer.get(key);
  }

  function getMeritHalo(merit) {
    const points = Math.max(0, Number(merit) || 0);
    const earnedRings = Math.floor(points / 20);
    const rings = earnedRings === 0 ? 0 : ((earnedRings - 1) % 3) + 1;
    const tier = Math.floor(earnedRings / 3);
    const tierNames = ['Kim', 'Ngọc', 'Tử Liên', 'Lưu Ly', 'Bạch Kim'];
    const nextMilestone = (Math.floor(points / 20) + 1) * 20;

    return {
      rings,
      tier: tier % tierNames.length,
      label: rings
        ? `Hào quang ${tierNames[tier % tierNames.length]}: ${rings}/3 vòng`
        : `Còn ${nextMilestone - points} CĐ để khai mở hào quang`
    };
  }

  let spiritCharacterId = 0;
  function renderMonasticCharacter(appearance, extraClass = '', merit = 0, breakthrough = false) {
    const id = `spirit-${++spiritCharacterId}`;
    const label = appearance.key === 'nun' ? 'Ma ni cô' : 'Ma chú tiểu';
    const halo = getMeritHalo(merit);
    return `
      <div class="monastic-character ${extraClass}${breakthrough ? ' merit-breakthrough' : ''}" data-robe="${appearance.robe}" data-order="${appearance.key}" data-pose="kneel" data-halo-rings="${halo.rings}" data-halo-tier="${halo.tier}" role="img" aria-label="${label}, ${Number(merit || 0).toLocaleString('vi-VN')} công đức, ${halo.label}">
        <svg class="spirit-art" viewBox="0 0 120 160" aria-hidden="true">
          <defs>
            <linearGradient id="${id}-spirit" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stop-color="#f2fff5" stop-opacity=".97" />
              <stop offset=".46" stop-color="#b9eedb" stop-opacity=".92" />
              <stop offset="1" stop-color="#67b99f" stop-opacity=".88" />
            </linearGradient>
            <linearGradient id="${id}-robe" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stop-color="#f4e3b2" />
              <stop offset=".48" stop-color="#bca56f" />
              <stop offset="1" stop-color="#776347" />
            </linearGradient>
            <linearGradient id="${id}-face" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stop-color="#f2ddc7" />
              <stop offset=".55" stop-color="#d8b99a" />
              <stop offset="1" stop-color="#aa826a" />
            </linearGradient>
          </defs>
          <g class="spirit-pose spirit-standing">
            <ellipse class="spirit-ground" cx="60" cy="145" rx="33" ry="7" />
            <path class="spirit-tail" d="M29 77 Q17 99 30 120 Q40 137 52 128 Q60 145 70 129 Q86 139 93 118 Q104 99 91 77Z" fill="url(#${id}-spirit)" />
            <path class="spirit-robe" d="M43 49 Q34 52 28 62 L18 84 Q25 92 38 88 L34 116 Q60 131 86 116 L82 88 Q95 92 102 83 L91 61 Q84 52 76 49Z" fill="url(#${id}-robe)" />
            <path class="spirit-robe-line" d="M59 53 Q51 69 60 91 Q68 72 61 54 M43 91 Q47 105 44 117 M77 91 Q73 105 77 117" />
            <path class="spirit-sleeve" d="M32 63 Q24 70 27 82 Q37 88 48 79 M88 63 Q96 70 93 82 Q83 88 72 79" />
            <path class="spirit-head" d="M41 24 Q42 10 60 10 Q78 10 79 25 L76 42 Q71 52 60 52 Q49 52 44 42Z" fill="url(#${id}-face)" />
            <path class="ghost-veil" d="M40 28 Q37 8 59 6 Q83 6 81 31 L76 26 Q75 14 60 13 Q46 14 45 29 L48 41 Q43 39 40 28Z" />
            <path class="ghost-eye ghost-eye-left" d="M49 32 Q53 35 56 32" />
            <path class="ghost-eye ghost-eye-right" d="M64 32 Q68 35 71 32" />
            <path class="ghost-mouth" d="M57 40 Q60 42 63 40" />
            <path class="ghost-cheek" d="M45 37 Q49 39 52 37 M68 37 Q71 39 75 37" />
            <path class="spirit-hands" d="M57 68 Q54 61 57 57 Q60 55 61 62 Q64 55 67 58 Q69 62 64 69 L61 75Z" />
            <path class="spirit-trim" d="M39 54 Q59 65 80 54 M42 113 Q60 121 78 113" />
            <circle class="spirit-bead" cx="60" cy="82" r="3" />
          </g>
          <g class="spirit-pose spirit-kneeling">
            <ellipse class="spirit-ground" cx="60" cy="145" rx="38" ry="7" />
            <path class="spirit-tail" d="M30 90 Q20 106 29 128 Q42 141 56 128 Q70 142 88 126 Q99 106 88 89Z" fill="url(#${id}-spirit)" />
            <path class="spirit-robe" d="M43 49 Q32 54 29 67 L26 96 Q31 109 43 108 L39 127 Q60 137 81 127 L77 108 Q91 109 95 96 L90 67 Q86 54 76 49Z" fill="url(#${id}-robe)" />
            <path class="spirit-robe-line" d="M59 54 Q52 72 60 97 Q68 76 61 54 M43 101 Q51 109 60 108 Q70 109 78 101" />
            <path class="spirit-sleeve" d="M33 67 Q24 77 29 91 Q40 96 52 83 M87 67 Q96 77 91 91 Q80 96 68 83" />
            <path class="spirit-head" d="M42 25 Q43 11 60 11 Q77 11 78 26 L75 42 Q70 51 60 51 Q50 51 45 42Z" fill="url(#${id}-face)" />
            <path class="ghost-veil" d="M40 28 Q37 8 59 6 Q83 6 81 31 L76 26 Q75 14 60 13 Q46 14 45 29 L48 41 Q43 39 40 28Z" />
            <path class="ghost-eye ghost-eye-left" d="M49 32 Q53 35 56 32" />
            <path class="ghost-eye ghost-eye-right" d="M64 32 Q68 35 71 32" />
            <path class="ghost-mouth" d="M57 40 Q60 42 63 40" />
            <path class="ghost-cheek" d="M45 37 Q49 39 52 37 M68 37 Q71 39 75 37" />
            <path class="spirit-hands" d="M57 74 Q53 68 57 64 Q60 62 61 69 Q64 62 67 65 Q69 69 64 76 L61 81Z" />
            <path class="spirit-trim" d="M39 57 Q59 66 80 57 M43 123 Q60 131 77 123" />
            <circle class="spirit-bead" cx="60" cy="91" r="3" />
          </g>
          <g class="spirit-pose spirit-bowing">
            <ellipse class="spirit-ground" cx="60" cy="145" rx="41" ry="7" />
            <path class="spirit-tail" d="M31 83 Q21 101 29 125 Q43 138 57 124 Q71 140 89 123 Q98 103 88 82Z" fill="url(#${id}-spirit)" />
            <path class="spirit-robe" d="M42 47 Q32 52 28 68 L24 91 Q35 101 49 91 L55 75 Q64 91 78 96 Q91 98 97 88 L83 63 Q75 51 66 48Z" fill="url(#${id}-robe)" />
            <path class="spirit-robe-line" d="M47 54 Q59 65 57 83 M42 91 Q58 101 75 96" />
            <path class="spirit-sleeve" d="M32 66 Q23 78 30 91 Q40 96 51 84 M80 65 Q92 73 91 86 Q83 92 72 83" />
            <path class="spirit-head" d="M55 77 Q57 64 70 64 Q83 65 84 78 L81 91 Q77 98 68 97 Q60 95 57 88Z" fill="url(#${id}-face)" />
            <path class="ghost-veil" d="M54 81 Q51 62 69 60 Q88 61 87 82 L81 77 Q80 67 69 67 Q59 68 59 82 L61 89 Q56 88 54 81Z" />
            <path class="ghost-eye ghost-eye-left" d="M63 81 Q66 83 68 81" />
            <path class="ghost-eye ghost-eye-right" d="M73 81 Q76 83 78 81" />
            <path class="spirit-hands" d="M48 91 Q44 87 47 84 Q50 82 53 89 Q57 84 60 87 Q61 90 56 95 L52 99Z" />
            <path class="spirit-trim" d="M38 57 Q52 66 67 55 M42 94 Q59 104 76 98" />
          </g>
          <g class="spirit-pose spirit-prostrate">
            <ellipse class="spirit-ground" cx="60" cy="128" rx="46" ry="6" />
            <path class="prostrate-contact" d="M24 122 Q60 126 96 122" />
            <path class="prostrate-legs" d="M36 94 Q45 90 54 99 L60 108 L68 98 Q77 91 86 96 L91 111 Q83 124 68 119 L60 114 L51 120 Q37 125 29 112Z" fill="url(#${id}-spirit)" />
            <path class="spirit-robe prostrate-robe" d="M40 48 Q60 38 80 48 L88 68 Q87 82 76 90 L69 99 L51 99 L43 90 Q32 82 32 68Z" fill="url(#${id}-robe)" />
            <path class="spirit-robe-line prostrate-folds" d="M45 59 Q57 68 58 87 M75 59 Q64 69 63 87 M44 92 Q59 101 76 92" />
            <path class="spirit-sleeve prostrate-arms" d="M39 56 Q27 62 28 78 L35 99 Q39 105 45 99 L51 88 M81 56 Q93 62 92 78 L85 99 Q81 105 75 99 L69 88" />
            <path class="spirit-head prostrate-head" d="M48 86 Q49 74 60 74 Q72 74 73 86 L71 98 Q67 105 60 105 Q52 103 49 97Z" fill="url(#${id}-face)" />
            <path class="ghost-veil prostrate-veil" d="M47 88 Q45 71 60 70 Q76 71 75 89 L70 84 Q69 76 60 76 Q52 77 52 89 L54 96 Q49 95 47 88Z" />
            <path class="ghost-eye prostrate-eye" d="M54 93 Q60 96 66 93" />
            <path class="spirit-hands prostrate-palms" d="M34 98 Q37 94 42 96 L49 100 Q51 103 47 105 L37 105 Q33 103 34 98Z M86 98 Q83 94 78 96 L71 100 Q69 103 73 105 L83 105 Q87 103 86 98Z" />
            <path class="spirit-trim" d="M40 53 Q60 63 80 53 M45 86 Q60 94 75 86" />
          </g>
          <g class="merit-halo-pos merit-halo-upright">
            <ellipse class="merit-halo-ring merit-halo-ring-1" cx="60" cy="3" rx="18" ry="4" />
            <ellipse class="merit-halo-ring merit-halo-ring-2" cx="60" cy="3" rx="25" ry="6" />
            <ellipse class="merit-halo-ring merit-halo-ring-3" cx="60" cy="3" rx="32" ry="8" />
            <path class="merit-halo-sparkle sparkle-a" d="M28 -8 L30 -3 L35 -1 L30 1 L28 6 L26 1 L21 -1 L26 -3Z" />
            <path class="merit-halo-sparkle sparkle-b" d="M91 -5 L92 -2 L95 -1 L92 0 L91 3 L90 0 L87 -1 L90 -2Z" />
          </g>
          <g class="merit-halo-pos merit-halo-bowing">
            <ellipse class="merit-halo-ring merit-halo-ring-1" cx="70" cy="58" rx="17" ry="4" />
            <ellipse class="merit-halo-ring merit-halo-ring-2" cx="70" cy="58" rx="24" ry="6" />
            <ellipse class="merit-halo-ring merit-halo-ring-3" cx="70" cy="58" rx="31" ry="8" />
            <path class="merit-halo-sparkle sparkle-a" d="M39 47 L41 52 L46 54 L41 56 L39 61 L37 56 L32 54 L37 52Z" />
            <path class="merit-halo-sparkle sparkle-b" d="M99 50 L100 53 L103 54 L100 55 L99 58 L98 55 L95 54 L98 53Z" />
          </g>
          <g class="merit-halo-pos merit-halo-prostrate">
            <ellipse class="merit-halo-ring merit-halo-ring-1" cx="60" cy="68" rx="17" ry="4" />
            <ellipse class="merit-halo-ring merit-halo-ring-2" cx="60" cy="68" rx="24" ry="6" />
            <ellipse class="merit-halo-ring merit-halo-ring-3" cx="60" cy="68" rx="31" ry="8" />
            <path class="merit-halo-sparkle sparkle-a" d="M29 57 L31 62 L36 64 L31 66 L29 71 L27 66 L22 64 L27 62Z" />
            <path class="merit-halo-sparkle sparkle-b" d="M90 60 L91 63 L94 64 L91 65 L90 68 L89 65 L86 64 L89 63Z" />
          </g>
        </svg>
      </div>
    `;
  }

  const centralSpriteStack = document.getElementById('centralSpriteStack');
  if (centralSpriteStack) {
    centralSpriteStack.innerHTML = renderMonasticCharacter({ robe: 'earth', key: 'novice', label: 'Ma chú tiểu' });
  }

  function getDevoteeKey(devotee) {
    return String(devotee?.uniqueId || devotee?.name || '').trim().toLocaleLowerCase('vi');
  }

  function renderVipCushions(leaderboard = [], meritMilestones = new Set()) {
    const layer = document.getElementById('vipCushionsLayer');
    if (!layer) return;

    layer.innerHTML = VIP_CUSHION_COORDS.map((slot, idx) => {
      const dev = leaderboard[idx];
      if (!dev) return '';
      const appearance = getMonasticAppearance(dev.uniqueId || dev.name);
      const halo = getMeritHalo(dev.merit);
      const reachedMilestone = meritMilestones.has(getDevoteeKey(dev));
      return `
        <div class="vip-devotee-slot" data-devotee-key="${escapeHtml(getDevoteeKey(dev))}" data-lantern-x="${slot.x}" data-lantern-y="${slot.y - 90}" data-robe="${appearance.robe}" data-order="${appearance.key}" data-halo-tier="${halo.tier}" title="${escapeHtml(halo.label)}" style="left: ${slot.x}px; top: ${slot.y}px; z-index: ${12 + idx};">
          ${renderMonasticCharacter(appearance, '', dev.merit, reachedMilestone)}
          <div class="vip-rank-pill">
            <span class="vip-rank-num">${slot.rank}</span>
            <span class="vip-rank-name">${escapeHtml(shortenName(dev.name, 12))}</span>
          </div>
          ${halo.rings ? `<span class="merit-halo-badge" title="${escapeHtml(halo.label)}">✨ ${halo.rings}/3</span>` : ''}
        </div>
      `;
    }).join('');
  }

  // 5. Dựng Đạo Tràng 40 Phật Tử Quỳ Lễ Hai Bên Thảm Đỏ (5 Hàng x 4 Cột mỗi bên)
  const congregationHall = document.getElementById('congregationHall');
  const HALL_SEAT_COORDS = [];

  (function buildHallGrid() {
    const rows = 5;
    const colsPerSide = 4;
    for (let r = 0; r < rows; r++) {
      const progress = r / (rows - 1); // 0 (xa) -> 1 (gần)
      const y = Math.round(1290 + progress * 355); // 1290 -> 1645
      const scale = +(0.76 + progress * 0.28).toFixed(2);

      // Cánh trái thảm đỏ
      const leftInnerX = Math.round(335 - progress * 48); // mép thảm mở rộng dần
      const leftOuterX = 48;
      for (let c = 0; c < colsPerSide; c++) {
        const t = c / (colsPerSide - 1);
        const x = Math.round(leftOuterX + t * (leftInnerX - leftOuterX));
        HALL_SEAT_COORDS.push({ side: 'L', row: r, col: c, x, y, scale });
      }

      // Cánh phải thảm đỏ
      const rightInnerX = Math.round(745 + progress * 48);
      const rightOuterX = 1032;
      for (let c = 0; c < colsPerSide; c++) {
        const t = c / (colsPerSide - 1);
        const x = Math.round(rightInnerX + t * (rightOuterX - rightInnerX));
        HALL_SEAT_COORDS.push({ side: 'R', row: r, col: c, x, y, scale });
      }
    }
  })();

  let lastRenderedLeaderboardJson = '';

  function renderCongregationHall(leaderboard = [], meritMilestones = new Set()) {
    if (!congregationHall) return;
    // Những người xếp từ hạng 7 trở đi ngồi ở các vị trí đầu tiên cạnh thảm đỏ
    const hallViewers = leaderboard.slice(6);
    const sig = JSON.stringify(hallViewers.map((d) => `${getDevoteeKey(d)}:${d.name}:${d.merit}`));
    if (sig === lastRenderedLeaderboardJson && congregationHall.children.length > 0) return;
    lastRenderedLeaderboardJson = sig;

    // Ưu tiên gắn thẻ tên vào các ghế gần thảm đỏ dễ nhìn nhất
    const labeledSeatIndices = [
      3, 4, 11, 12, 19, 20, 27, 28, 35, 36, 2, 5, 10, 13, 18, 21, 26, 29
    ];
    const seatViewerMap = new Map();
    hallViewers.forEach((viewer, idx) => {
      if (idx < labeledSeatIndices.length) {
        seatViewerMap.set(labeledSeatIndices[idx], viewer);
      }
    });

    congregationHall.innerHTML = HALL_SEAT_COORDS.map((seat, idx) => {
      const viewer = seatViewerMap.get(idx);
      const appearance = getMonasticAppearance(viewer?.uniqueId || viewer?.name || `seat-${idx}`);
      const badgeHtml = viewer
        ? `
          <div class="seat-badge">
            <span class="seat-avatar">${
              viewer.avatar
                ? `<img src="${escapeHtml(viewer.avatar)}" alt="" />`
                : escapeHtml(String(viewer.name || 'P').charAt(0).toUpperCase())
            }</span>
            <span class="seat-username">${escapeHtml(shortenName(viewer.name, 11))}</span>
          </div>
        `
        : '';

      return `
        <div
          class="hall-seat"
          ${viewer ? `data-devotee-key="${escapeHtml(getDevoteeKey(viewer))}" data-lantern-x="${seat.x}" data-lantern-y="${seat.y - 88}"` : ''}
          data-robe="${appearance.robe}"
          data-order="${appearance.key}"
          data-seat-idx="${idx}"
          style="left: ${seat.x}px; top: ${seat.y}px; z-index: ${20 + seat.row * 2}; transform: translate(-50%, -100%) scale(${seat.scale}); --idle-delay: -${((idx * 0.27) % 3.5).toFixed(2)}s;"
        >
          ${renderMonasticCharacter(
            appearance,
            '',
            viewer?.merit,
            viewer ? meritMilestones.has(getDevoteeKey(viewer)) : false
          )}
          ${badgeHtml}
        </div>
      `;
    }).join('');
  }

  function pulseHallBowing() {
    if (!congregationHall) return;
    const seats = congregationHall.querySelectorAll('.hall-seat');
    seats.forEach((el, i) => {
      if (i % 4 !== 0) return;
      const character = el.querySelector('.monastic-character');
      if (!character) return;
      const delay = (Math.floor(i / 4) % 4) * 80;
      [
        [0, 'forehead'],
        [140, 'bowMid'],
        [300, 'prostrateDeep'],
        [620, 'bowMid'],
        [780, 'kneel']
      ].forEach(([offset, pose]) => {
        setTimeout(() => { character.dataset.pose = pose; }, delay + offset);
      });
    });
  }

  let prostrationTimers = [];
  function clearProstrationTimers() {
    while (prostrationTimers.length > 0) {
      clearTimeout(prostrationTimers.pop());
    }
  }

  // Pose changes drive the same 3D character through walking and bowing.
  function setCentralPose(poseKey) {
    const stack = document.getElementById('centralSpriteStack');
    if (!stack) return;
    const character = stack.querySelector('.monastic-character');
    if (character) character.dataset.pose = poseKey;
  }

  function schedulePose(ms, poseKey) {
    prostrationTimers.push(
      setTimeout(() => {
        setCentralPose(poseKey);
      }, ms)
    );
  }

  // Tam Bái: chắp tay, cúi thân, phủ phục trán chạm đất, rồi ngẩng lên.
  function playThreeBowsSequence(startDelayMs = 0) {
    schedulePose(startDelayMs, 'kneelDown');
    schedulePose(startDelayMs + 240, 'kneel');

    const bowOffsets = [startDelayMs + 480, startDelayMs + 2180, startDelayMs + 3880];
    bowOffsets.forEach((t0) => {
      schedulePose(t0, 'forehead');
      schedulePose(t0 + 220, 'bowMid');
      schedulePose(t0 + 420, 'prostrate');
      schedulePose(t0 + 600, 'prostrateDeep');
      schedulePose(t0 + 1100, 'prostrate');
      schedulePose(t0 + 1300, 'bowMid');
      schedulePose(t0 + 1500, 'kneel');
    });
  }

  // Hiệu ứng thí chủ ĐỨNG ĐI BỘ từng bước dọc thảm đỏ rồi Hạ gối Quỳ Đảnh Lễ (trên cùng 1 nhân vật, không bao giờ mất hình)
  function animateWalkerOnCarpet(user, avatar, actionLabel, wish) {
    const centralEl = document.getElementById('centralWorshipper');
    if (!centralEl) return;

    clearProstrationTimers();
    updateCentralWorshipper(user, avatar, actionLabel, wish, false);

    // Khởi động bước đi từ cuối thảm đỏ lên chính điện
    centralEl.classList.remove('walking-up');
    void centralEl.offsetWidth;
    centralEl.classList.add('walking-up');

    setCentralPose('walk1');
    for (let step = 1; step <= 10; step++) {
      schedulePose(step * 185, step % 2 === 0 ? 'walk1' : 'walk2');
    }

    // Khi bước tới trước Lư Hương (2.05s): dừng bước, hạ gối quỳ xuống đệm và bắt đầu Đảnh lễ 3 lạy
    prostrationTimers.push(
      setTimeout(() => {
        centralEl.classList.remove('walking-up');
      }, 2100)
    );
    playThreeBowsSequence(2050);
  }

  function updateCentralWorshipper(user, avatar, actionLabel, wish, doThreeBows = true) {
    const nameEl = document.getElementById('centralName');
    const actEl = document.getElementById('centralAction');
    const wishEl = document.getElementById('centralWishBubble');
    const avatarEl = document.getElementById('centralAvatar');
    const spriteStack = document.getElementById('centralSpriteStack');
    const orderEl = document.getElementById('centralOrder');
    const beam = document.getElementById('sacredLightBeam');
    const appearance = getMonasticAppearance(user);

    if (spriteStack) {
      spriteStack.dataset.robe = appearance.robe;
      spriteStack.dataset.order = appearance.key;
      const character = spriteStack.querySelector('.monastic-character');
      if (character) {
        character.dataset.robe = appearance.robe;
        character.dataset.order = appearance.key;
      }
    }
    if (orderEl) orderEl.textContent = appearance.label;

    if (nameEl) nameEl.textContent = user || 'Thí Chủ Hữu Duyên';
    if (actEl) actEl.textContent = actionLabel || '✨ Dâng hương cầu an';
    if (wishEl) wishEl.textContent = `“${wish || 'Nam Mô A Di Đà Phật, cầu bình an cát tường'}”`;

    if (avatarEl) {
      if (avatar) {
        avatarEl.innerHTML = `<img src="${escapeHtml(avatar)}" alt="" />`;
      } else {
        avatarEl.textContent = String(user || '🙏').trim().charAt(0).toUpperCase();
      }
    }

    if (doThreeBows) {
      clearProstrationTimers();
      const centralEl = document.getElementById('centralWorshipper');
      if (centralEl) centralEl.classList.remove('walking-up');
      playThreeBowsSequence(0);
    }
    if (beam) {
      beam.classList.add('intense');
      setTimeout(() => beam.classList.remove('intense'), 4500);
    }

    const haloSys = document.getElementById('buddhaHaloSystem');
    const lotusHand = document.getElementById('lotusHandHalo');
    if (haloSys) {
      haloSys.classList.add('flare');
      setTimeout(() => haloSys.classList.remove('flare'), 3600);
    }
    if (lotusHand) {
      lotusHand.classList.add('flare');
      setTimeout(() => lotusHand.classList.remove('flare'), 3600);
    }
    particles.spawnBellWave(540, 260, 2);

    // Cập nhật dòng thông báo dưới thanh HUD
    const hudName = document.getElementById('devoteeNameLine');
    const hudAct = document.getElementById('devoteeActionTag');
    if (hudName) hudName.textContent = user || 'Thí Chủ';
    if (hudAct) hudAct.textContent = actionLabel || 'Dâng hương';
  }

  // 6. Cập nhật toàn bộ giao diện theo State từ Server
  let hasInitializedRealLeader = false;
  let previousLeaderMerit = new Map();

  function updateUIState(st) {
    if (!st) return;

    document.getElementById('statIncense').textContent = Number(st.totalIncense || 0).toLocaleString('vi-VN');
    document.getElementById('statMerit').textContent = Number(st.totalMerit || 0).toLocaleString('vi-VN');
    document.getElementById('statWoodenFish').textContent = Number(st.woodenFishHits || 0).toLocaleString('vi-VN');

    renderIncenseSticks(st.activeIncenseSticks || 9);

    const lb = Array.isArray(st.leaderboard) ? st.leaderboard : [];
    const meritMilestones = new Set();
    const currentLeaderMerit = new Map();
    lb.forEach((devotee) => {
      const key = getDevoteeKey(devotee);
      const merit = Math.max(0, Number(devotee.merit) || 0);
      const previousMerit = previousLeaderMerit.get(key);
      if (previousMerit !== undefined && Math.floor(merit / 20) > Math.floor(previousMerit / 20)) {
        meritMilestones.add(key);
      }
      currentLeaderMerit.set(key, merit);
    });
    previousLeaderMerit = currentLeaderMerit;
    renderVipCushions(lb, meritMilestones);
    renderCongregationHall(lb, meritMilestones);

    // Đồng bộ tên Chủ Lễ mặc định theo người dẫn đầu thực tế nếu chưa có sự kiện mới
    if (!hasInitializedRealLeader && lb.length > 0) {
      hasInitializedRealLeader = true;
      const topDev = lb[0];
      updateCentralWorshipper(
        topDev.name,
        topDev.avatar,
        `✨ Công đức: ${Number(topDev.merit).toLocaleString('vi-VN')} CĐ`,
        topDev.lastWish || 'Nam Mô A Di Đà Phật, cầu bình an cát tường',
        false
      );
    }

    // Cập nhật Bảng TẤM LÒNG THÀNH ở góc dưới phải (Top 4)
    const lbList = document.getElementById('leaderboardList');
    if (lbList) {
      lbList.innerHTML = lb
        .slice(0, 4)
        .map(
          (item) => `
          <div class="leader-item">
            <span class="leader-rank">${item.rank}</span>
            <span class="leader-name">${escapeHtml(shortenName(item.name, 14))}</span>
            <span class="leader-merit">${Number(item.merit).toLocaleString('vi-VN')}</span>
          </div>
        `
        )
        .join('');
    }

    // Trạng thái kết nối TikTok Live
    const liveDot = document.getElementById('liveDot');
    const liveText = document.getElementById('liveStatusText');
    if (st.tiktok?.connected) {
      liveDot.classList.add('connected');
      liveText.textContent = `LIVE @${st.tiktok.username} • ${st.tiktok.viewerCount || 0} mắt`;
    } else if (st.tiktok?.connecting) {
      liveDot.classList.remove('connected');
      liveText.textContent = `Đang kết nối @${st.tiktok.username}...`;
    } else {
      liveDot.classList.remove('connected');
      liveText.textContent = st.settings?.autoSim
        ? 'CHÙA LINH ỨNG • TỰ ĐỘNG GIẢ LẬP ĐÔNG NGƯỜI'
        : 'CHÙA LINH ỨNG • ĐỨC PHẬT A DI ĐÀ';
    }

    const btnAutoSim = document.getElementById('btnToggleAutoSim');
    if (btnAutoSim && st.settings) {
      btnAutoSim.textContent = st.settings.autoSim
        ? '🤖 Tự động Giả lập Người Xem: ĐANG BẬT'
        : '🤖 Tự động Giả lập Người Xem: TẮT';
      btnAutoSim.classList.toggle('active-toggle', Boolean(st.settings.autoSim));
    }
    if (st.settings) {
      if (typeof st.settings.musicVolume === 'number') {
        audio.setMusicVolume(st.settings.musicVolume);
        const sMus = document.getElementById('sliderMusicVol');
        const vMus = document.getElementById('valMusicVol');
        const pct = Math.round(st.settings.musicVolume * 100);
        if (sMus) sMus.value = String(pct);
        if (vMus) vMus.textContent = `${pct}%`;
      }
      if (typeof st.settings.ttsVolume === 'number') {
        audio.setTtsVolume(st.settings.ttsVolume);
        const sTts = document.getElementById('sliderTtsVol');
        const vTts = document.getElementById('valTtsVol');
        const pct = Math.round(st.settings.ttsVolume * 100);
        if (sTts) sTts.value = String(pct);
        if (vTts) vTts.textContent = `${pct}%`;
      }
    }


    const feed = document.getElementById('eventFeed');
    if (feed && Array.isArray(st.recentEvents)) {
      feed.innerHTML = st.recentEvents
        .slice(0, 8)
        .map((ev) => `<div class="event-feed-item">${formatEventSummary(ev)}</div>`)
        .join('');
    }
  }

  function formatEventSummary(ev) {
    switch (ev.type) {
      case 'burnIncense':
        return `🔥 <strong>${escapeHtml(ev.user)}</strong> dâng ${ev.count} nén nhang (+${ev.merit} CĐ)`;
      case 'strikeWoodenFish':
        return `🪵 <strong>${escapeHtml(ev.user)}</strong> gõ mõ ${ev.count} nhịp (+${ev.merit} CĐ)`;
      case 'ringBell':
        return `🔔 <strong>${escapeHtml(ev.user)}</strong> thỉnh Đại Hồng Chung (+${ev.merit} CĐ)`;
      case 'sendPrayer':
        return `🏮 <strong>${escapeHtml(ev.user)}</strong> cầu phúc: “${escapeHtml(ev.wish)}”`;
      case 'offerGift':
      case 'grandCeremony':
        return `🪷 <strong>${escapeHtml(ev.user)}</strong> dâng <em>${escapeHtml(ev.giftName)}</em> (+${ev.merit} CĐ)`;
      case 'drawFortune':
        return `🎋 <strong>${escapeHtml(ev.user)}</strong> gieo được Quẻ số ${ev.fortune?.number} (${ev.fortune?.rank})`;
      default:
        return `✨ <strong>${escapeHtml(ev.user || 'Thí chủ')}</strong> tương tác`;
    }
  }

  // 7. Xử lý hiệu ứng khi có Nghi Thức mới
  let fortuneTimer = null;
  let grandTimer = null;
  const ritualHotspotTimers = new Map();

  function pulseRitualHotspot(id, className, duration = 1800) {
    const hotspot = document.getElementById(id);
    if (!hotspot) return;
    const previousTimer = ritualHotspotTimers.get(id);
    if (previousTimer) clearTimeout(previousTimer);
    hotspot.classList.remove('is-striking', 'is-ringing');
    void hotspot.offsetWidth;
    hotspot.classList.add(className);
    ritualHotspotTimers.set(id, setTimeout(() => {
      hotspot.classList.remove(className);
      ritualHotspotTimers.delete(id);
    }, duration));
  }

  function triggerRitualVisuals(ev) {
    if (!ev) return;

    if (ev.ttsText && ev.type !== 'drawFortune') {
      audio.enqueueTts(ev.ttsText, { voice: ev.ttsVoice || 'maichi' });
    }

    switch (ev.type) {
      case 'burnIncense': {
        audio.playIncenseChime();
        particles.spawnIncenseBurst(540, 895);
        particles.spawnFloatingMerit(`+${ev.merit} Công Đức`, 540, 860, '#ffe082');
        animateWalkerOnCarpet(ev.user, ev.avatar, `🔥 Dâng ${ev.count} nén hương (+${ev.merit} CĐ)`, ev.wish);
        break;
      }

      case 'strikeWoodenFish': {
        const strikes = Math.max(1, Math.min(6, Number(ev.count) || 1));
        for (let i = 0; i < strikes; i++) {
          setTimeout(() => audio.playWoodenFish(1 + (i % 2) * 0.12), i * 135);
        }
        pulseRitualHotspot('woodenFishStation', 'is-striking', Math.max(900, strikes * 135 + 500));
        particles.spawnFloatingMerit(`+${ev.merit} Công Đức`, 890, 935, '#ffd54f');
        break;
      }

      case 'ringBell': {
        audio.playTempleBell(1.0);
        pulseRitualHotspot('bellStation', 'is-ringing', 2600);
        pulseHallBowing();
        particles.spawnBellWave(105, 980, 4);
        particles.spawnFloatingMerit(`+${ev.merit} Công Đức`, 190, 935, '#fff3b0');
        updateCentralWorshipper(ev.user, ev.avatar, `🔔 Thỉnh Đại Hồng Chung (+${ev.merit} CĐ)`, ev.wish);
        break;
      }

      case 'sendPrayer': {
        spawnSkyLantern(ev.user, ev.wish, ev);
        audio.playIncenseChime();
        particles.spawnFloatingMerit(`+${ev.merit} Công Đức`, 540, 920, '#ffb74d');
        animateWalkerOnCarpet(ev.user, ev.avatar, `🏮 Cầu phúc (+${ev.merit} CĐ)`, ev.wish);
        break;
      }

      case 'offerGift': {
        if (ev.giftType === 'lotus') {
          audio.playIncenseChime();
          audio.playTempleBell(0.85);
          particles.spawnLotusOffering(540, 502);
          particles.spawnFloatingMerit(`🪷 +${ev.merit} Công Đức`, 540, 490, '#ffe082');
          const lotusHand = document.getElementById('lotusHandHalo');
          lotusHand?.classList.add('offering');
          setTimeout(() => lotusHand?.classList.remove('offering'), 3800);
          updateCentralWorshipper(
            ev.user,
            ev.avatar,
            `🪷 Dâng Hoa Sen Vàng (+${ev.merit} CĐ)`,
            ev.wish || 'Dâng Đài Hoa Sen Vàng lên Tam Bảo, nguyện ánh sáng từ bi lan tỏa'
          );
          animateWalkerOnCarpet(ev.user, ev.avatar, `🪷 Dâng ${ev.giftName} (+${ev.merit} CĐ)`, ev.wish);
        } else {
          audio.playIncenseChime();
          audio.playTempleBell(0.85);
          particles.spawnIncenseBurst(540, 895);
          particles.spawnFloatingMerit(`+${ev.merit} Công Đức`, 540, 840, '#fff3b0');
          animateWalkerOnCarpet(ev.user, ev.avatar, `🪷 Dâng ${ev.giftName} (+${ev.merit} CĐ)`, ev.wish);
        }
        break;
      }

      case 'grandCeremony': {
        audio.playTempleBell(1.2);
        setTimeout(() => audio.playTempleBell(1.1), 900);
        particles.spawnGrandCeremonyRain();
        pulseHallBowing();
        showGrandCeremonyBanner(ev.user, ev.giftName, ev.merit);
        animateWalkerOnCarpet(ev.user, ev.avatar, `🐉 ${ev.giftName} (+${ev.merit} CĐ)`, ev.wish);
        break;
      }

      case 'drawFortune': {
        audio.playFortuneShake();
        updateCentralWorshipper(
          ev.user,
          ev.avatar,
          `🎋 Đang xin xăm...`,
          `Thí chủ ${ev.user} đang thành tâm xin quẻ...`,
          false
        );
        // Chỉ hiển thị tờ Quẻ Xăm đúng thời điểm giọng đọc bắt đầu vang lên!
        audio.enqueueTts(ev.ttsText || '', {
          voice: ev.ttsVoice || 'maichi',
          onStart: () => {
            audio.playIncenseChime();
            showFortuneModal(ev.user, ev.fortune);
            updateCentralWorshipper(
              ev.user,
              ev.avatar,
              `🎋 Quẻ số ${ev.fortune?.number} (${ev.fortune?.rank})`,
              ev.fortune?.meaning || '',
              true
            );
          },
          onEnd: () => {
            clearTimeout(fortuneTimer);
            fortuneTimer = setTimeout(() => {
              document.getElementById('fortuneModal')?.classList.remove('visible');
            }, 1800);
          }
        });
        break;
      }
    }
  }

  function spawnSkyLantern(user, wish, devotee) {
    const layer = document.getElementById('skyLanternsLayer');
    if (!layer) return;
    const lantern = document.createElement('div');
    lantern.className = 'sky-lantern';
    const devoteeKey = getDevoteeKey(devotee);
    const seatedPerson = [...document.querySelectorAll(
      '#vipCushionsLayer [data-devotee-key], #congregationHall [data-devotee-key]'
    )].find((seat) => seat.dataset.devoteeKey === devoteeKey);
    const x = seatedPerson ? Number(seatedPerson.dataset.lanternX) : null;
    const y = seatedPerson ? Number(seatedPerson.dataset.lanternY) : 1560;
    lantern.style.left = seatedPerson
      ? `${x - 130}px`
      : `${80 + Math.floor(Math.random() * 640)}px`;
    lantern.style.bottom = `${1920 - y}px`;
    lantern.innerHTML = `
      <span class="sky-lantern-icon" aria-hidden="true">🏮</span>
      <div class="sky-lantern-user">🙏 ${escapeHtml(user)}</div>
      <div class="sky-lantern-wish">“${escapeHtml(wish)}”</div>
    `;
    layer.appendChild(lantern);
    setTimeout(() => {
      lantern.remove();
    }, 10600);
  }

  function showFortuneModal(user, fortune) {
    if (!fortune) return;
    const modal = document.getElementById('fortuneModal');
    document.getElementById('fortuneRankBadge').textContent = fortune.rank.toUpperCase();
    document.getElementById('fortuneTitle').textContent = `Quẻ Số ${fortune.number} — ${fortune.title}`;
    document.getElementById('fortuneDevotee').textContent = `Thí chủ cầu quẻ: ${user}`;
    document.getElementById('fortunePoem').textContent = fortune.poem;
    document.getElementById('fortuneMeaning').textContent = `Lời bàn: ${fortune.meaning}`;

    modal.classList.add('visible');
    clearTimeout(fortuneTimer);
    fortuneTimer = setTimeout(() => {
      modal.classList.remove('visible');
    }, 15000);
  }

  document.getElementById('fortuneModal')?.addEventListener('click', () => {
    document.getElementById('fortuneModal').classList.remove('visible');
  });

  function showGrandCeremonyBanner(user, giftName, merit) {
    const banner = document.getElementById('grandCeremonyBanner');
    document.getElementById('grandTitle').textContent = `🐉 ${giftName.toUpperCase()} 🐉`;
    document.getElementById('grandSub').textContent = `Đại Thí Chủ ${user} • Công Đức Vô Lượng (+${merit} CĐ)`;
    banner.classList.add('visible');
    clearTimeout(grandTimer);
    grandTimer = setTimeout(() => {
      banner.classList.remove('visible');
    }, 6800);
  }

  // 8. Kết nối JSON-RPC 2.0 WebSocket & Gửi Lệnh RPC
  let ws = null;
  let rpcId = 1;
  const pendingRpc = new Map();
  const rpcLabels = {
    'temple.burnIncense': 'Thắp hương',
    'temple.sendPrayer': 'Thả hoa đăng',
    'temple.strikeWoodenFish': 'Gõ mõ',
    'temple.ringBell': 'Thỉnh chuông',
    'temple.drawFortune': 'Xin xăm',
    'temple.offerGift': 'Dâng lễ vật',
    'temple.grandCeremony': 'Đại lễ',
    'temple.updateSettings': 'Cập nhật âm thanh',
    'live.connect': 'Kết nối TikTok Live',
    'live.setAutoSim': 'Cập nhật giả lập'
  };

  function setRpcFeedback(message, state = 'idle') {
    const feedback = document.getElementById('rpcFeedback');
    if (!feedback) return;
    feedback.textContent = message;
    feedback.dataset.state = state;
  }

  function settlePendingRpc(id, error, result) {
    const pending = pendingRpc.get(id);
    if (!pending) return false;
    pendingRpc.delete(id);
    clearTimeout(pending.timer);
    if (error) pending.reject(new Error(error.message || 'Lệnh RPC thất bại'));
    else pending.resolve(result);
    return true;
  }

  function connectWebSocket() {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${proto}//${window.location.host}/ws`);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.id !== undefined && settlePendingRpc(msg.id, msg.error, msg.result)) return;
        if (msg.method === 'temple.state') {
          updateUIState(msg.params);
        } else if (msg.method === 'temple.event') {
          if (msg.params?.state) updateUIState(msg.params.state);
          if (msg.params?.event) triggerRitualVisuals(msg.params.event);
        } else if (msg.method === 'tts.play') {
          if (msg.params?.url) {
            audio.enqueueTts(msg.params.text || 'Nam mô A Di Đà Phật', {
              voice: msg.params.voice || 'maichi',
              url: msg.params.url
            });
          }
        }
      } catch (_) {}
    };

    ws.onclose = () => {
      for (const [id] of pendingRpc) {
        settlePendingRpc(id, { message: 'Mất kết nối WebSocket trong khi chờ phản hồi' });
      }
      setTimeout(connectWebSocket, 2000);
    };
  }
  connectWebSocket();

  async function callRpc(method, params = {}) {
    audio.ensureContext();
    const label = rpcLabels[method] || method;
    setRpcFeedback(`Đang xử lý: ${label}...`, 'pending');
    const payload = {
      jsonrpc: '2.0',
      id: rpcId++,
      method,
      params
    };
    try {
      if (ws && ws.readyState === WebSocket.OPEN) {
        await new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            settlePendingRpc(payload.id, { message: 'Hết thời gian chờ phản hồi từ máy chủ' });
          }, 15000);
          pendingRpc.set(payload.id, { resolve, reject, timer });
          try {
            ws.send(JSON.stringify(payload));
          } catch (error) {
            settlePendingRpc(payload.id, error);
          }
        });
      } else {
        const res = await fetch('/rpc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok || data?.error) throw new Error(data?.error?.message || `HTTP ${res.status}`);
        if (data?.result?.state) updateUIState(data.result.state);
        if (data?.result?.event) triggerRitualVisuals(data.result.event);
      }
      setRpcFeedback(`Đã thực hiện: ${label}.`, 'success');
      return true;
    } catch (error) {
      setRpcFeedback(`Không thực hiện được: ${error.message}`, 'error');
      return false;
    }
  }

  function getFormInput() {
    const user = document.getElementById('inputDevoteeName')?.value.trim() || 'Quỳnh_Finn';
    const wish =
      document.getElementById('inputDevoteeWish')?.value.trim() ||
      'Cầu cho gia đình bình an, tài lộc hanh thông';
    return { user, wish };
  }

  // Gắn sự kiện tương tác trực tiếp trên màn hình 9:16 & Thanh HUD dưới đáy
  document.getElementById('incenseBurnerZone')?.addEventListener('click', () => {
    const { user, wish } = getFormInput();
    callRpc('temple.burnIncense', { user, count: 3, wish });
  });

  document.getElementById('cardIncense')?.addEventListener('click', () => {
    const { user, wish } = getFormInput();
    callRpc('temple.burnIncense', { user, count: 3, wish });
  });

  document.getElementById('cardBlessing')?.addEventListener('click', () => {
    const { user, wish } = getFormInput();
    callRpc('temple.sendPrayer', { user, wish });
  });

  document.getElementById('cardLotus')?.addEventListener('click', () => {
    const { user, wish } = getFormInput();
    callRpc('temple.offerGift', {
      user,
      giftType: 'lotus',
      coins: 20,
      giftName: 'Đài Hoa Sen Vàng',
      wish
    });
  });

  document.getElementById('woodenFishStation')?.addEventListener('click', () => {
    const { user } = getFormInput();
    callRpc('temple.strikeWoodenFish', { user, count: 1 });
  });

  document.getElementById('bellStation')?.addEventListener('click', () => {
    const { user, wish } = getFormInput();
    callRpc('temple.ringBell', { user, count: 1, wish, readTts: true });
  });

  document.getElementById('fortuneCylinder')?.addEventListener('click', () => {
    const { user, wish } = getFormInput();
    callRpc('temple.drawFortune', { user, topic: wish });
  });

  // Các nút trên Quick RPC Dock bên phải
  document.getElementById('btnRpcIncense')?.addEventListener('click', () => {
    const { user, wish } = getFormInput();
    callRpc('temple.burnIncense', { user, count: 3, wish });
  });

  document.getElementById('btnRpcLantern')?.addEventListener('click', () => {
    const { user, wish } = getFormInput();
    callRpc('temple.sendPrayer', { user, wish });
  });

  document.getElementById('btnRpcWoodenFish')?.addEventListener('click', () => {
    const { user } = getFormInput();
    callRpc('temple.strikeWoodenFish', { user, count: 5 });
  });

  document.getElementById('btnRpcBell')?.addEventListener('click', () => {
    const { user, wish } = getFormInput();
    callRpc('temple.ringBell', { user, count: 1, wish, readTts: true });
  });

  document.getElementById('btnRpcFortune')?.addEventListener('click', () => {
    const { user, wish } = getFormInput();
    callRpc('temple.drawFortune', { user, topic: wish });
  });

  document.getElementById('btnRpcGiftLotus')?.addEventListener('click', () => {
    const { user, wish } = getFormInput();
    callRpc('temple.offerGift', {
      user,
      giftType: 'lotus',
      coins: 20,
      giftName: 'Đài Hoa Sen Vàng',
      wish
    });
  });

  document.getElementById('btnRpcGrandCeremony')?.addEventListener('click', () => {
    const { user, wish } = getFormInput();
    callRpc('temple.grandCeremony', {
      user,
      coins: 299,
      giftName: 'Đại Lễ Kim Long Chầu Phật',
      wish
    });
  });

  document.getElementById('btnConnectTikTok')?.addEventListener('click', () => {
    const username = document.getElementById('inputTikTokUser')?.value.trim();
    if (!username) return;
    callRpc('live.connect', { username });
  });

  let autoSimState = false;
  document.getElementById('btnToggleAutoSim')?.addEventListener('click', () => {
    autoSimState = !autoSimState;
    callRpc('live.setAutoSim', { enabled: autoSimState });
  });

  document.getElementById('btnToggleTts')?.addEventListener('click', (e) => {
    audio.ttsEnabled = !audio.ttsEnabled;
    const btn = e.currentTarget;
    btn.textContent = `🎙️ Giọng Đọc: ${audio.ttsEnabled ? 'BẬT' : 'TẮT'}`;
    btn.classList.toggle('active-toggle', audio.ttsEnabled);
  });

  document.getElementById('btnToggleMusic')?.addEventListener('click', (e) => {
    audio.bgMusicEnabled = !audio.bgMusicEnabled;
    if (audio.bgMusicEnabled) {
      audio.startZenAmbience();
    } else {
      audio.stopZenAmbience();
    }
    const btn = e.currentTarget;
    btn.textContent = `🎵 Nhạc Nền: ${audio.bgMusicEnabled ? 'BẬT' : 'TẮT'}`;
    btn.classList.toggle('active-toggle', audio.bgMusicEnabled);
  });

  // Khởi tạo và gắn sự kiện thanh trượt chỉnh âm lượng Nhạc nền & Giọng đọc
  const sliderMusicVol = document.getElementById('sliderMusicVol');
  const valMusicVol = document.getElementById('valMusicVol');
  if (sliderMusicVol && valMusicVol) {
    const initMusPct = Math.round(audio.bgBaseVolume * 100);
    sliderMusicVol.value = String(initMusPct);
    valMusicVol.textContent = `${initMusPct}%`;
    sliderMusicVol.addEventListener('input', (e) => {
      const pct = Number(e.target.value);
      valMusicVol.textContent = `${pct}%`;
      audio.ensureContext();
      audio.setMusicVolume(pct / 100);
    });
    sliderMusicVol.addEventListener('change', (e) => {
      const pct = Number(e.target.value);
      callRpc('temple.updateSettings', { musicVolume: +(pct / 100).toFixed(2) });
    });
  }

  const sliderTtsVol = document.getElementById('sliderTtsVol');
  const valTtsVol = document.getElementById('valTtsVol');
  if (sliderTtsVol && valTtsVol) {
    const initTtsPct = Math.round(audio.ttsVolume * 100);
    sliderTtsVol.value = String(initTtsPct);
    valTtsVol.textContent = `${initTtsPct}%`;
    sliderTtsVol.addEventListener('input', (e) => {
      const pct = Number(e.target.value);
      valTtsVol.textContent = `${pct}%`;
      audio.setTtsVolume(pct / 100);
    });
    sliderTtsVol.addEventListener('change', (e) => {
      const pct = Number(e.target.value);
      callRpc('temple.updateSettings', { ttsVolume: +(pct / 100).toFixed(2) });
    });
  }

  function shortenName(name, maxLen = 13) {
    const str = String(name || '');
    return str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str;
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
})();
