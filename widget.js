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

    return items.filter(function (item) {
      var title = normalizeValue(item.titleName);
      var description = normalizeValue(item.descText);
      var slug = normalizeValue(item.linkDest);

      return (
        title.indexOf(normalizedQuery) !== -1 ||
        description.indexOf(normalizedQuery) !== -1 ||
        slug.indexOf(normalizedQuery) !== -1
      );
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
            linkDest: itemNode.getAttribute('data-slug') || href || '#'
          };
        });
      }

      renderList(root, items);

      if (!input) {
        return;
      }

      input.addEventListener('input', function (event) {
        var filtered = filterItems(items, event.target.value);
        renderList(root, filtered);
      });
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
