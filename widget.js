(function () {
  'use strict';

  function normalizeValue(value) {
    return String(value || '').trim().toLowerCase();
  }

  function parseLinkObjectString(value) {
    var trimmed = String(value || '').trim();
    if (!trimmed) {
      return null;
    }

    if (trimmed.charAt(0) === '{' && trimmed.charAt(trimmed.length - 1) === '}') {
      trimmed = trimmed.slice(1, -1);
    }

    if (!trimmed) {
      return null;
    }

    var result = {};
    trimmed.split(/,\s*/).forEach(function (pair) {
      var separatorIndex = pair.indexOf('=');
      if (separatorIndex === -1) {
        return;
      }

      var key = pair.slice(0, separatorIndex).trim();
      var val = pair.slice(separatorIndex + 1).trim();

      if (!key) {
        return;
      }

      result[key] = val;
    });

    return Object.keys(result).length ? result : null;
  }

  function resolveLinkDetails(linkValue) {
    var href = '#';
    var target = '';
    var rel = '';
    var searchParts = [];

    if (linkValue && typeof linkValue === 'object') {
      if (typeof linkValue.href === 'string') {
        var hrefCandidate = linkValue.href.trim();
        if (hrefCandidate && hrefCandidate !== 'null') {
          if (hrefCandidate.indexOf('=') !== -1 && /\b(href|raw_url|url)=/.test(hrefCandidate)) {
            var parsedFromHref = parseLinkObjectString(hrefCandidate);
            if (parsedFromHref) {
              if (!parsedFromHref.target && typeof linkValue.target === 'string') {
                var parsedTarget = linkValue.target.trim();
                if (parsedTarget && parsedTarget !== 'null') {
                  parsedFromHref.target = parsedTarget;
                }
              }

              if (!parsedFromHref.rel && typeof linkValue.rel === 'string') {
                var parsedRel = linkValue.rel.trim();
                if (parsedRel && parsedRel !== 'null') {
                  parsedFromHref.rel = parsedRel;
                }
              }

              return resolveLinkDetails(parsedFromHref);
            }
          }
          href = hrefCandidate;
        }
      }

      if (href === '#' && typeof linkValue.raw_url === 'string') {
        var rawUrlCandidate = linkValue.raw_url.trim();
        if (rawUrlCandidate && rawUrlCandidate !== 'null') {
          href = rawUrlCandidate;
        }
      }

      if (href === '#' && typeof linkValue.url === 'string') {
        var urlCandidate = linkValue.url.trim();
        if (urlCandidate && urlCandidate !== 'null') {
          href = urlCandidate;
        }
      }

      if (typeof linkValue.target === 'string' && linkValue.target.trim() && linkValue.target !== 'null') {
        target = linkValue.target.trim();
      }

      if (!target && (linkValue.openInNewTab === true || linkValue.open_in_new_tab === true || linkValue.target === 'NEW_TAB')) {
        target = '_blank';
      }

      if (typeof linkValue.rel === 'string' && linkValue.rel.trim() && linkValue.rel !== 'null') {
        rel = linkValue.rel.trim();
      }

      ['value', 'label', 'href', 'raw_url', 'url', 'slug'].forEach(function (key) {
        if (typeof linkValue[key] === 'string') {
          var searchCandidate = linkValue[key].trim();
          if (searchCandidate && searchCandidate !== 'null') {
            searchParts.push(searchCandidate);
          }
        }
      });
    } else if (typeof linkValue === 'string' && linkValue.trim()) {
      var directValue = linkValue.trim();
      if (directValue === '[object Object]') {
        directValue = '';
      }
      var parsedObject = null;

      if (directValue.indexOf('=') !== -1 && /\b(href|raw_url|url)=/.test(directValue)) {
        parsedObject = parseLinkObjectString(directValue);
      }

      if (parsedObject) {
        return resolveLinkDetails(parsedObject);
      }

      if (directValue && directValue !== 'null') {
        href = directValue;
        searchParts.push(directValue);
      }
    }

    if (!href) {
      href = '#';
    }

    if (!rel && target === '_blank') {
      rel = 'noopener noreferrer';
    }

    if (searchParts.indexOf(href) === -1) {
      searchParts.push(href);
    }

    return {
      href: href,
      target: target,
      rel: rel,
      searchValue: searchParts.join(' ').trim()
    };
  }

  function normalizeItem(item) {
    var safeItem = item || {};
    var linkDetails = resolveLinkDetails(safeItem.linkDest);

    if (!linkDetails.target && typeof safeItem.linkTarget === 'string' && safeItem.linkTarget.trim()) {
      linkDetails.target = safeItem.linkTarget.trim();
    }

    if (!linkDetails.rel && typeof safeItem.linkRel === 'string' && safeItem.linkRel.trim()) {
      linkDetails.rel = safeItem.linkRel.trim();
    }

    var searchMeta = linkDetails.searchValue;
    if (!searchMeta && typeof safeItem.linkSearchValue === 'string') {
      searchMeta = safeItem.linkSearchValue;
    }

    return {
      titleName: safeItem.titleName || '',
      descText: safeItem.descText || '',
      linkDest: linkDetails.href,
      linkTarget: linkDetails.target,
      linkRel: linkDetails.rel,
      linkSearchValue: searchMeta || linkDetails.href
    };
  }

  function renderList(root, items) {
    var list = root.querySelector('.js-search-widget-list');
    var emptyState = root.querySelector('.js-search-widget-empty');

    if (!list) {
      return;
    }

    list.innerHTML = '';

    if (!items.length) {
      if (emptyState) {
        emptyState.classList.add('is-visible');
        emptyState.setAttribute('aria-hidden', 'false');
      }
      return;
    }

    if (emptyState) {
      emptyState.classList.remove('is-visible');
      emptyState.setAttribute('aria-hidden', 'true');
    }

    var fragment = document.createDocumentFragment();

    items.forEach(function (item) {
      var listItem = document.createElement('li');
      listItem.className = 'search-widget__item';

      var link = document.createElement('a');
      link.className = 'search-widget__link';
      link.href = item.linkDest || '#';

      if (item.linkTarget) {
        link.target = item.linkTarget;
      }

      if (item.linkRel) {
        link.rel = item.linkRel;
      }

      var title = document.createElement('span');
      title.className = 'search-widget__item-title';
      title.textContent = item.titleName || '';

      var description = document.createElement('span');
      description.className = 'search-widget__item-description';
      description.textContent = item.descText || '';

      link.appendChild(title);
      link.appendChild(description);
      listItem.appendChild(link);
      fragment.appendChild(listItem);
    });

    list.appendChild(fragment);
  }

  function filterItems(items, query) {
    var normalizedQuery = normalizeValue(query);
    if (!normalizedQuery) {
      return items.slice();
    }

    var ranked = [];

    items.forEach(function (item, index) {
      var title = normalizeValue(item.titleName);
      var description = normalizeValue(item.descText);
      var link = normalizeValue(item.linkDest);
      var linkMeta = normalizeValue(item.linkSearchValue);

      var titleIndex = title.indexOf(normalizedQuery);
      var descriptionIndex = description.indexOf(normalizedQuery);
      var linkIndex = linkMeta ? linkMeta.indexOf(normalizedQuery) : link.indexOf(normalizedQuery);

      if (titleIndex === -1 && descriptionIndex === -1 && linkIndex === -1) {
        return;
      }

      var rankValue;

      if (titleIndex !== -1) {
        rankValue = 0 + titleIndex / 1000;
      } else if (descriptionIndex !== -1) {
        rankValue = 1 + descriptionIndex / 1000;
      } else {
        rankValue = 2 + linkIndex / 1000;
      }

      ranked.push({
        item: item,
        rank: rankValue,
        originalIndex: index
      });
    });

    ranked.sort(function (a, b) {
      if (a.rank !== b.rank) {
        return a.rank - b.rank;
      }
      return a.originalIndex - b.originalIndex;
    });

    return ranked.map(function (entry) {
      return entry.item;
    });
  }

  function enhanceWidget(widgetInstance) {
    widgetInstance.on('ready', function () {
      var node = widgetInstance.node || document;
      var root = node.querySelector('.search-widget');
      if (!root) {
        return;
      }

      var input = root.querySelector('.js-search-widget-input');
      var emptyState = root.querySelector('.js-search-widget-empty');
      var trigger = root.querySelector('.js-search-widget-trigger');
      var dialog = root.querySelector('.js-search-widget-dialog');
      var closeButton = root.querySelector('.js-search-widget-close');
      var body = document.body;
      var lastFocused = null;

      if (emptyState) {
        emptyState.classList.remove('is-visible');
        emptyState.setAttribute('aria-hidden', 'true');
      }

      var items = [];
      if (widgetInstance.data && Array.isArray(widgetInstance.data.pageList)) {
        items = widgetInstance.data.pageList.map(normalizeItem);
      } else {
        var existingItems = root.querySelectorAll('.search-widget__item');
        items = Array.prototype.map.call(existingItems, function (itemNode) {
          var linkNode = itemNode.querySelector('a');
          var href = linkNode ? linkNode.getAttribute('href') : '#';
          var target = linkNode ? linkNode.getAttribute('target') : '';
          var rel = linkNode ? linkNode.getAttribute('rel') : '';

          return normalizeItem({
            titleName: itemNode.getAttribute('data-title') || itemNode.textContent,
            descText: itemNode.getAttribute('data-description') || '',
            linkDest: {
              href: itemNode.getAttribute('data-link') || href || '#',
              target: target,
              rel: rel
            }
          });
        });
      }

      renderList(root, items);

      if (input) {
        input.value = '';
        input.addEventListener('input', function (event) {
          var filtered = filterItems(items, event.target.value);
          renderList(root, filtered);
        });
      }

      if (trigger && dialog && input) {
        root.classList.add('search-widget--enhanced');
        dialog.setAttribute('aria-hidden', 'true');
        dialog.classList.remove('is-visible');

        var openDialog = function () {
          if (dialog.classList.contains('is-visible')) {
            return;
          }

          lastFocused = document.activeElement;
          dialog.classList.add('is-visible');
          dialog.setAttribute('aria-hidden', 'false');
          trigger.setAttribute('aria-expanded', 'true');

          if (body) {
            body.classList.add('search-widget-dialog-open');
          }

          window.requestAnimationFrame(function () {
            input.focus();
          });
        };

        var closeDialog = function () {
          if (!dialog.classList.contains('is-visible')) {
            return;
          }

          dialog.classList.remove('is-visible');
          dialog.setAttribute('aria-hidden', 'true');
          trigger.setAttribute('aria-expanded', 'false');

          if (body) {
            body.classList.remove('search-widget-dialog-open');
          }

          if (lastFocused && typeof lastFocused.focus === 'function') {
            window.requestAnimationFrame(function () {
              lastFocused.focus();
            });
          }
        };

        trigger.addEventListener('click', function (event) {
          event.preventDefault();
          openDialog();
        });

        if (closeButton) {
          closeButton.addEventListener('click', function () {
            closeDialog();
          });
        }

        dialog.addEventListener('click', function (event) {
          if (event.target === dialog) {
            closeDialog();
          }
        });

        dialog.addEventListener('keydown', function (event) {
          if (event.key === 'Escape' || event.key === 'Esc') {
            event.preventDefault();
            closeDialog();
          }
        });

        widgetInstance.on('destroy', function () {
          closeDialog();
        });
      } else if (trigger && input) {
        trigger.addEventListener('click', function (event) {
          event.preventDefault();
          input.focus();
        });
      }
    });
  }

  function bootstrap(target) {
    if (!target) {
      return;
    }

    if (Array.isArray(target)) {
      target.forEach(enhanceWidget);
    } else {
      enhanceWidget(target);
    }
  }

  if (window.Widget) {
    bootstrap(window.Widget);
  } else if (window.widget) {
    bootstrap(window.widget);
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      if (window.Widget) {
        bootstrap(window.Widget);
      } else if (window.widget) {
        bootstrap(window.widget);
      }
    });
  }
})();
