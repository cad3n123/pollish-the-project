/* =============================================================================
   SIGNUP POPUP — a panel that rises into the bottom half of the screen a moment
   after the curtain lifts, inviting a subscribe. A copy of the same panel on the
   RAREROOM site, in behaviour as well as looks:

     · shows once per visit, and not again for three months after that
     · dismissed by the X, by Escape, or by clicking anything in the nav
     · subscribing dismisses it too, after holding the result long enough to read
     · subscribes in place (JSONP) rather than navigating off to Mailchimp

   The site's own subscribe box is untouched and still works exactly as it did;
   this is a second, additional prompt. Both carry the same Mailchimp tag.
   ============================================================================= */
(function () {
  // Pollish's tag + interest group in the shared RAREROOM audience. The three
  // sites post to ONE audience, so these are what tell the signups apart:
  // RAREROOM 11840392 / group 1, Kelsi Kee 11840393 / 2, Pollish 11840394 / 4.
  const MAILCHIMP = {
    action:
      'https://rareroomeast.us9.list-manage.com/subscribe/post-json?u=dc1ef2b26411dc4872ade1a16&id=12eb6d76fb&f_id=00c451e1f0',
    botField: 'b_dc1ef2b26411dc4872ade1a16_12eb6d76fb',
    tags: ['11840394'],
    groups: { 28117: ['4'] },
  };

  // localStorage, not session: when it was last shown has to survive the tab
  // closing, or "three months" would reset on every visit.
  const SEEN_KEY = 'pollish-signup-popup';
  const COOLDOWN = 90 * 24 * 60 * 60 * 1000; // ~3 months

  function dueAgain() {
    try {
      const last = Number(localStorage.getItem(SEEN_KEY));
      if (!last) return true; // never set, or not a number at all
      if (last > Date.now()) return true; // clock set backwards; treat as stale
      return Date.now() - last >= COOLDOWN;
    } catch (e) {
      // Private-mode Safari throws on localStorage. Show it; it just can't
      // remember across visits.
      return true;
    }
  }

  function markSeen() {
    try {
      localStorage.setItem(SEEN_KEY, String(Date.now()));
    } catch (e) {
      /* nothing to do — see above */
    }
  }

  /* The tag and group fields as query string, shaped the way the endpoint wants
     them: `tags` is one comma-separated list, each group option its own
     `group[category][option]` field. */
  function audienceParams() {
    let out = '';
    if (MAILCHIMP.tags.length)
      out += '&tags=' + encodeURIComponent(MAILCHIMP.tags.join(','));
    Object.keys(MAILCHIMP.groups).forEach(function (group) {
      MAILCHIMP.groups[group].forEach(function (option) {
        // The brackets are part of the field NAME Mailchimp matches on, so the
        // whole thing is encoded as a unit.
        out += '&' + encodeURIComponent('group[' + group + '][' + option + ']') + '=1';
      });
    });
    return out;
  }

  function build() {
    const pop = document.createElement('div');
    pop.className = 'signup-pop';
    pop.setAttribute('role', 'dialog');
    // Not aria-modal: the page behind stays live and scrollable on purpose. It's
    // a panel you can ignore, not a barrier — and nothing here touches the
    // document's overflow, so it can't shift the layout.
    pop.setAttribute('aria-labelledby', 'signup-pop-title');
    pop.innerHTML =
      '<button type="button" class="signup-pop__close" data-close aria-label="Close">' +
      '<img src="/images/x.png" alt=""></button>' +
      '<h2 class="signup-pop__title" id="signup-pop-title">sign up to receive updates</h2>' +
      '<form class="signup-pop__form" novalidate>' +
      '<div class="signup-pop__field">' +
      '<input class="signup-pop__input" type="email" name="EMAIL" required autocomplete="email" placeholder="Email address" aria-label="Email address">' +
      '</div>' +
      '<div style="position:absolute;left:-9999px" aria-hidden="true">' +
      '<input type="text" name="' + MAILCHIMP.botField + '" tabindex="-1" value="" autocomplete="off">' +
      '</div>' +
      '<button class="signup-pop__submit" type="submit">SUBSCRIBE</button>' +
      '<p class="signup-pop__consent">By subscribing you agree to receive emails from Pollish. ' +
      'See our <button type="button" data-privacy>Privacy Policy</button>.</p>' +
      '<p class="signup-pop__msg" role="status" aria-live="polite"></p>' +
      '</form>';
    document.body.appendChild(pop);
    return pop;
  }

  let closeOpen = null;

  function open() {
    if (!dueAgain()) return;
    const pop = build();
    const form = pop.querySelector('.signup-pop__form');
    const input = form.querySelector('input[name="EMAIL"]');
    const honeypot = form.querySelector('input[name="' + MAILCHIMP.botField + '"]');
    const msg = pop.querySelector('.signup-pop__msg');

    function setMsg(text, kind) {
      msg.textContent = text;
      msg.className = 'signup-pop__msg' + (kind ? ' is-' + kind : '');
    }

    function close() {
      if (!closeOpen) return; // already closing — don't restart the timer
      closeOpen = null;
      markSeen(); // dismissed counts as shown: the three months start here
      pop.classList.remove('open');
      // Outlast the transition, then drop it so its fields leave the tab order.
      setTimeout(function () {
        pop.remove();
      }, 500);
    }
    closeOpen = close;

    pop.querySelector('[data-close]').addEventListener('click', close);
    // The consent link opens this site's own privacy sheet, the same one the
    // footer link opens.
    pop.querySelector('[data-privacy]').addEventListener('click', function () {
      const sheet = document.getElementById('privacy-policy-div');
      if (sheet) sheet.classList.add('active');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && pop.isConnected) close();
    });
    // Following a nav item is an answer of sorts — you'd rather look at what you
    // clicked than at the form.
    document.querySelectorAll('#vertical-nav .nav-item').forEach(function (item) {
      item.addEventListener('click', close);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const email = input.value.trim();
      if (!email || !input.checkValidity()) {
        input.focus();
        setMsg('Please enter a valid email.', 'err');
        return;
      }
      /* The honeypot is offscreen and aria-hidden, so a person never fills it and
         anything in it came from a script filling every field it found. Show the
         normal success line and send nothing: a bot told "blocked" gets a signal
         to adapt, one told "thanks" has no reason to look again. */
      if (honeypot && honeypot.value) {
        setMsg('Thanks — you’re on the list.', 'ok');
        form.reset();
        return;
      }
      setMsg('Signing up…', '');

      const cb = 'mcCb' + Math.random().toString(36).slice(2);
      const script = document.createElement('script');
      function cleanup() {
        delete window[cb];
        script.remove();
      }
      const timer = setTimeout(function () {
        cleanup();
        setMsg('Something went wrong — please try again.', 'err');
      }, 8000);

      window[cb] = function (res) {
        clearTimeout(timer);
        cleanup();
        const raw = (res && res.msg ? String(res.msg) : '').replace(/<[^>]*>/g, '').trim();
        // Check the message text BEFORE the result flag: Mailchimp reports an
        // already-subscribed address in `msg` but has been seen to return it
        // with result:'success' too, which makes every resubmit read as fresh.
        if (/already subscribed/i.test(raw)) {
          setMsg('You’re already subscribed.', 'ok');
          setTimeout(close, 2200);
        } else if (res && res.result === 'success') {
          setMsg('Thanks — you’re on the list.', 'ok');
          form.reset();
          // Hold the panel open a beat so the result is actually read.
          setTimeout(close, 2200);
        } else {
          setMsg(raw || 'Please enter a valid email.', 'err');
        }
      };
      script.onerror = function () {
        clearTimeout(timer);
        cleanup();
        setMsg('Something went wrong — please try again.', 'err');
      };
      script.src =
        MAILCHIMP.action +
        '&EMAIL=' + encodeURIComponent(email) +
        '&' + encodeURIComponent(MAILCHIMP.botField) + '=' + // honeypot, left empty
        audienceParams() +
        '&c=' + cb;
      document.body.appendChild(script);
    });

    /* Flush layout so the panel is measured at its offscreen start position
       before the class flips — otherwise the browser collapses both states into
       one paint and it appears already open, with no slide.

       Deliberately NOT requestAnimationFrame: rAF never fires while the tab is
       in the background, which left the panel built but stuck hidden forever. */
    void pop.offsetHeight;
    pop.classList.add('open');
  }

  /* Wait for the curtain to lift before starting the clock.

     A plain timer from DOMContentLoaded is wrong here: the curtain sits at
     z-index 100 and this panel at 80, so an early panel opens UNDERNEATH it —
     unseen, and having spent its one showing for the next three months. The
     curtain also covers the password gate, which can hold the page indefinitely.
     So watch for the curtain losing `.active`, then trail it by a moment so the
     panel rises over a page that has already settled. */
  function whenPageVisible(run) {
    const curtain = document.getElementById('curtain');
    if (!curtain || !curtain.classList.contains('active')) {
      run();
      return;
    }
    const observer = new MutationObserver(function () {
      if (!curtain.classList.contains('active')) {
        observer.disconnect();
        run();
      }
    });
    observer.observe(curtain, { attributes: true, attributeFilter: ['class'] });
  }

  function schedule() {
    whenPageVisible(function () {
      setTimeout(open, 1600);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule);
  } else {
    schedule();
  }
})();
