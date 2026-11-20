/* @ds-bundle: {"format":4,"namespace":"MostCritical","components":[{"name":"Button"},{"name":"IconButton"},{"name":"StarRating"},{"name":"ScoreDial"},{"name":"Chip"},{"name":"Badge"},{"name":"TextField"},{"name":"Switch"},{"name":"Tabs"},{"name":"Avatar"},{"name":"FilmCard"},{"name":"ReviewCard"},{"name":"Icon"}]} */
(function () {
  var React = window.React;
  var h = React.createElement;
  var useState = React.useState;

  function cx() {
    var out = [];
    for (var i = 0; i < arguments.length; i++) if (arguments[i]) out.push(arguments[i]);
    return out.join(' ');
  }

  /* ---------- Icon : trait 1.5px, bouts arrondis ---------- */
  var PATHS = {
    star: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z',
    heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
    bookmark: 'M7 4h10v16l-5-3.5L7 20z',
    play: 'M8 5.5v13l10-6.5z',
    ticket: 'M4 8a2 2 0 0 0 0 4v4h16v-4a2 2 0 0 1 0-4V4H4zM14 4v16',
    search: 'M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14zM20 20l-4-4',
    check: 'M5 12.5l4.5 4.5L19 7.5',
    alert: 'M12 8v5M12 16.5v.5M12 3l9.5 17h-19z',
    plus: 'M12 5v14M5 12h14',
    share: 'M12 15V4M7.5 8.5L12 4l4.5 4.5M5 13v6h14v-6',
    comment: 'M4 5h16v11H9l-5 4z',
    film: 'M4 4h16v16H4zM8 4v16M16 4v16M4 8h4M4 12h4M4 16h4M16 8h4M16 12h4M16 16h4'
  };
  function Icon(p) {
    var size = p.size || 20;
    return h('svg', {
      className: cx('mc-icon', p.className), width: size, height: size, viewBox: '0 0 24 24',
      fill: p.filled ? 'currentColor' : 'none', stroke: 'currentColor', strokeWidth: 1.5,
      strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': p.label ? undefined : true,
      role: p.label ? 'img' : undefined, 'aria-label': p.label
    }, h('path', { d: PATHS[p.name] || PATHS.star }));
  }

  /* ---------- Button ---------- */
  function Button(p) {
    var variant = p.variant || 'primary';
    var size = p.size || 'md';
    return h('button', {
      type: p.type || 'button', disabled: p.disabled, onClick: p.onClick,
      className: cx('mc-btn', 'mc-btn--' + variant, 'mc-btn--' + size, p.block && 'mc-btn--block', p.className)
    },
      p.icon ? h(Icon, { name: p.icon, size: size === 'sm' ? 16 : 18 }) : null,
      h('span', null, p.children)
    );
  }

  /* ---------- IconButton (toggle optionnel) ---------- */
  function IconButton(p) {
    var st = useState(!!p.defaultPressed);
    var pressed = p.pressed != null ? p.pressed : st[0];
    var toggle = p.toggle;
    return h('button', {
      type: 'button', 'aria-label': p.label, 'aria-pressed': toggle ? pressed : undefined,
      className: cx('mc-iconbtn', 'mc-iconbtn--' + (p.variant || 'ghost'), pressed && 'is-on', p.className),
      onClick: function (e) { if (toggle) st[1](!pressed); if (p.onClick) p.onClick(e); }
    }, h(Icon, { name: p.icon, size: 20, filled: toggle && pressed }));
  }

  /* ---------- StarRating ---------- */
  function StarShape(props) {
    var fill = props.fill; // 0, .5, 1
    var id = props.id;
    return h('svg', { width: props.size, height: props.size, viewBox: '0 0 24 24', 'aria-hidden': true, className: 'mc-star' },
      h('defs', null, h('clipPath', { id: id }, h('rect', { x: 0, y: 0, width: 12, height: 24 }))),
      h('path', { d: PATHS.star, className: 'mc-star__empty' }),
      fill === 1 ? h('path', { d: PATHS.star, className: 'mc-star__full' }) : null,
      fill === 0.5 ? h('path', { d: PATHS.star, className: 'mc-star__half', clipPath: 'url(#' + id + ')' }) : null
    );
  }
  var uid = 0;
  function StarRating(p) {
    var st = useState(p.defaultValue != null ? p.defaultValue : 0);
    var hv = useState(null);
    var idRef = React.useRef('bbs' + (++uid));
    var value = p.value != null ? p.value : st[0];
    var shown = hv[0] != null ? hv[0] : value;
    var size = p.size || 20;
    var interactive = !!p.interactive;
    var stars = [];
    for (var i = 1; i <= 5; i++) {
      var f = shown >= i ? 1 : shown >= i - 0.5 ? 0.5 : 0;
      var star = h(StarShape, { key: 's' + i, fill: f, size: size, id: idRef.current + '-' + i });
      if (interactive) {
        (function (i) {
          stars.push(h('span', { key: i, className: 'mc-stars__slot', style: { width: size, height: size } },
            star,
            h('button', { type: 'button', className: 'mc-stars__hit mc-stars__hit--l', 'aria-label': (i - 0.5) + ' sur 5',
              onMouseEnter: function () { hv[1](i - 0.5); }, onClick: function () { st[1](i - 0.5); if (p.onChange) p.onChange(i - 0.5); } }),
            h('button', { type: 'button', className: 'mc-stars__hit mc-stars__hit--r', 'aria-label': i + ' sur 5',
              onMouseEnter: function () { hv[1](i); }, onClick: function () { st[1](i); if (p.onChange) p.onChange(i); } })
          ));
        })(i);
      } else stars.push(star);
    }
    return h('span', { className: cx('mc-stars', p.className), role: interactive ? 'group' : 'img',
      'aria-label': 'Note : ' + value + ' sur 5', onMouseLeave: function () { hv[1](null); } },
      h('span', { className: 'mc-stars__row' }, stars),
      p.showValue ? h('span', { className: cx('mc-stars__value', value <= 2 && 'is-low') }, value ? value.toFixed(1) : '–') : null
    );
  }

  /* ---------- ScoreDial : la note comme un cadran de projecteur ---------- */
  function ScoreDial(p) {
    var value = p.value || 0;
    var size = p.size || 72;
    var r = 30, c = 2 * Math.PI * r, arc = c * 0.75;
    var pct = Math.max(0, Math.min(1, value / 5));
    return h('div', { className: cx('mc-dial', value <= 2 && 'is-low', p.className), style: { width: size, height: size },
      role: 'img', 'aria-label': 'Note ' + value + ' sur 5' },
      h('svg', { viewBox: '0 0 72 72', width: size, height: size },
        h('circle', { cx: 36, cy: 36, r: r, className: 'mc-dial__track', strokeDasharray: arc + ' ' + c, transform: 'rotate(135 36 36)' }),
        h('circle', { cx: 36, cy: 36, r: r, className: 'mc-dial__arc', strokeDasharray: (arc * pct) + ' ' + c, transform: 'rotate(135 36 36)' })
      ),
      h('span', { className: 'mc-dial__num', style: { fontSize: size * 0.36 } }, value.toFixed(1)),
      p.label ? h('span', { className: 'mc-dial__label' }, p.label) : null
    );
  }

  /* ---------- Chip (genre, filtre) ---------- */
  function Chip(p) {
    var st = useState(!!p.defaultSelected);
    var sel = p.selected != null ? p.selected : st[0];
    return h('button', { type: 'button', 'aria-pressed': sel, className: cx('mc-chip', sel && 'is-on', p.className),
      onClick: function (e) { st[1](!sel); if (p.onClick) p.onClick(e); } },
      sel ? h(Icon, { name: 'check', size: 14 }) : null, p.children);
  }

  /* ---------- Badge ---------- */
  function Badge(p) {
    var tone = p.tone || 'amber';
    return h('span', { className: cx('mc-badge', 'mc-badge--' + tone, p.className) },
      p.icon ? h(Icon, { name: p.icon, size: 12, filled: true }) : null, p.children);
  }

  /* ---------- TextField ---------- */
  var fid = 0;
  function TextField(p) {
    var idRef = React.useRef(p.id || 'bbf' + (++fid));
    var id = idRef.current;
    var Tag = p.multiline ? 'textarea' : 'input';
    return h('div', { className: cx('mc-field', p.error && 'is-error', p.className) },
      p.label ? h('label', { className: 'mc-field__label', htmlFor: id }, p.label) : null,
      h('div', { className: 'mc-field__box' },
        p.icon ? h(Icon, { name: p.icon, size: 18, className: 'mc-field__icon' }) : null,
        h(Tag, { id: id, className: 'mc-field__input', placeholder: p.placeholder, defaultValue: p.defaultValue,
          value: p.value, onChange: p.onChange, rows: p.multiline ? (p.rows || 4) : undefined, 'aria-invalid': !!p.error,
          'aria-describedby': (p.error || p.hint) ? id + '-msg' : undefined })
      ),
      (p.error || p.hint) ? h('p', { id: id + '-msg', className: 'mc-field__msg' },
        p.error ? h(Icon, { name: 'alert', size: 14 }) : null, p.error || p.hint) : null
    );
  }

  /* ---------- Switch ---------- */
  function Switch(p) {
    var st = useState(!!p.defaultChecked);
    var on = p.checked != null ? p.checked : st[0];
    return h('label', { className: cx('mc-switch', p.className) },
      h('button', { type: 'button', role: 'switch', 'aria-checked': on, className: cx('mc-switch__track', on && 'is-on'),
        onClick: function () { st[1](!on); if (p.onChange) p.onChange(!on); } }, h('span', { className: 'mc-switch__thumb' })),
      p.label ? h('span', { className: 'mc-switch__label' }, p.label) : null
    );
  }

  /* ---------- Tabs : l'onglet actif s'allume comme un écran ---------- */
  function Tabs(p) {
    var items = p.items || [];
    var st = useState(p.defaultValue || (items[0] && items[0].value));
    var val = p.value != null ? p.value : st[0];
    return h('div', { className: cx('mc-tabs', p.className), role: 'tablist' },
      items.map(function (it) {
        var on = it.value === val;
        return h('button', { key: it.value, type: 'button', role: 'tab', 'aria-selected': on, className: cx('mc-tab', on && 'is-on'),
          onClick: function () { st[1](it.value); if (p.onChange) p.onChange(it.value); } },
          it.label, it.count != null ? h('span', { className: 'mc-tab__count' }, it.count) : null);
      })
    );
  }

  /* ---------- Avatar ---------- */
  function Avatar(p) {
    var size = p.size || 36;
    var initials = (p.name || '?').split(' ').map(function (s) { return s[0]; }).join('').slice(0, 2).toUpperCase();
    return h('span', { className: cx('mc-avatar', p.critic && 'is-critic', p.className), style: { width: size, height: size, fontSize: size * 0.4 },
      title: p.name },
      p.src ? h('img', { src: p.src, alt: p.name }) : initials);
  }

  /* ---------- Poster placeholder (formes, pas d'image) ---------- */
  function Poster(p) {
    var v = (p.seed || 0) % 3;
    var shapes = [
      [h('rect', { key: 1, x: 0, y: 0, width: 200, height: 300, className: 'mc-pf-ground' }), h('circle', { key: 2, cx: 130, cy: 110, r: 70, className: 'mc-pf-amber' }), h('rect', { key: 3, x: 0, y: 200, width: 200, height: 100, className: 'mc-pf-ember' })],
      [h('rect', { key: 1, x: 0, y: 0, width: 200, height: 300, className: 'mc-pf-ember' }), h('rect', { key: 2, x: 30, y: 40, width: 140, height: 140, rx: 70, className: 'mc-pf-orange' }), h('rect', { key: 3, x: 0, y: 230, width: 200, height: 70, className: 'mc-pf-ground' })],
      [h('rect', { key: 1, x: 0, y: 0, width: 200, height: 300, className: 'mc-pf-surface' }), h('rect', { key: 2, x: 0, y: 60, width: 200, height: 24, className: 'mc-pf-amber' }), h('rect', { key: 3, x: 0, y: 100, width: 200, height: 12, className: 'mc-pf-orange' }), h('circle', { key: 4, cx: 100, cy: 220, r: 44, className: 'mc-pf-soft' })]
    ][v];
    return h('div', { className: 'mc-poster' },
      p.src ? h('img', { src: p.src, alt: '' }) : h('svg', { viewBox: '0 0 200 300', preserveAspectRatio: 'xMidYMid slice', 'aria-hidden': true }, shapes));
  }

  /* ---------- FilmCard ---------- */
  function FilmCard(p) {
    return h('article', { className: cx('mc-film', p.className) },
      h('div', { className: 'mc-film__media' },
        h(Poster, { src: p.poster, seed: p.seed }),
        p.badge ? h(Badge, { tone: 'orange', icon: 'heart', className: 'mc-film__badge' }, p.badge) : null,
        h('div', { className: 'mc-film__dial' }, h(ScoreDial, { value: p.score || 0, size: 52 })),
        h(IconButton, { icon: 'bookmark', label: 'Ajouter à ma liste', toggle: true, variant: 'overlay', className: 'mc-film__save' })
      ),
      h('div', { className: 'mc-film__body' },
        h('h3', { className: 'mc-film__title' }, p.title),
        h('p', { className: 'mc-film__meta' }, [p.year, p.duration, p.director].filter(Boolean).join(' · ')),
        p.genres ? h('div', { className: 'mc-film__genres' }, p.genres.map(function (g) { return h('span', { key: g, className: 'mc-film__genre' }, g); })) : null
      )
    );
  }

  /* ---------- ReviewCard ---------- */
  function ReviewCard(p) {
    var st = useState(!!p.liked);
    var liked = st[0];
    return h('article', { className: cx('mc-review', p.className) },
      h('header', { className: 'mc-review__head' },
        h(Avatar, { name: p.author, critic: p.critic, size: 40 }),
        h('div', { className: 'mc-review__who' },
          h('span', { className: 'mc-review__author' }, p.author, p.critic ? h(Badge, { tone: 'outline' }, 'Critique') : null),
          h('span', { className: 'mc-review__date' }, p.date)
        ),
        h(StarRating, { value: p.rating, size: 16, showValue: true })
      ),
      p.headline ? h('h4', { className: 'mc-review__headline' }, p.headline) : null,
      h('p', { className: 'mc-review__text' }, p.children),
      h('footer', { className: 'mc-review__foot' },
        h('button', { type: 'button', className: cx('mc-review__act', liked && 'is-on'), 'aria-pressed': liked, onClick: function () { st[1](!liked); } },
          h(Icon, { name: 'heart', size: 16, filled: liked }), (p.likes || 0) + (liked ? 1 : 0)),
        h('button', { type: 'button', className: 'mc-review__act' }, h(Icon, { name: 'comment', size: 16 }), p.comments || 0),
        h('button', { type: 'button', className: 'mc-review__act mc-review__act--end', 'aria-label': 'Partager' }, h(Icon, { name: 'share', size: 16 }))
      )
    );
  }

  window.MostCritical = {
    Button: Button, IconButton: IconButton, StarRating: StarRating, ScoreDial: ScoreDial,
    Chip: Chip, Badge: Badge, TextField: TextField, Switch: Switch, Tabs: Tabs, Avatar: Avatar,
    FilmCard: FilmCard, ReviewCard: ReviewCard, Icon: Icon
  };
})();
