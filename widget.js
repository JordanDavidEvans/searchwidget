(function () {
  'use strict';

  function normalizeValue(value) {
    return String(value || '').trim().toLowerCase();
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

      var titleIndex = title.indexOf(normalizedQuery);
      var descriptionIndex = description.indexOf(normalizedQuery);
      var linkIndex = link.indexOf(normalizedQuery);

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
        items = widgetInstance.data.pageList.slice();
      } else {
        var existingItems = root.querySelectorAll('.search-widget__item');
        items = Array.prototype.map.call(existingItems, function (itemNode) {
          var linkNode = itemNode.querySelector('a');
          var href = linkNode ? linkNode.getAttribute('href') : '#';
          return {
            titleName: itemNode.getAttribute('data-title') || itemNode.textContent,
            descText: itemNode.getAttribute('data-description') || '',
            linkDest: itemNode.getAttribute('data-link') || href || '#'
          };
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
