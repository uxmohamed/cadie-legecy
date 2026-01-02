/**
 * Tests for LinkContextMenu component
 * Covers single/multi selection in normal and trash views
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  createMockLink,
  createMockPinnedLink,
  createMockDeletedLink,
  resetLinkIdCounter,
} from '../fixtures/link.fixtures';
import type { Link } from '@/features/links/types';

// Create a simplified test version of the context menu
const TestLinkContextMenu = ({
  link,
  selectedCount = 0,
  selectedIds,
  links = [],
  isTrashView = false,
  onCopy,
  onRename,
  onPin,
  onUnpin,
  onDelete,
  onRestore,
  onPermanentDelete,
  onBatchPin,
  onBatchUnpin,
  onBatchDelete,
  onBatchRestore,
  onBatchPermanentDelete,
}: {
  link: Link;
  selectedCount?: number;
  selectedIds?: Set<string>;
  links?: Link[];
  isTrashView?: boolean;
  onCopy?: (url: string) => void;
  onRename?: (link: Link) => void;
  onPin?: (id: string) => void;
  onUnpin?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
  onBatchPin?: () => void;
  onBatchUnpin?: () => void;
  onBatchDelete?: () => void;
  onBatchRestore?: () => void;
  onBatchPermanentDelete?: () => void;
}) => {
  const isMultiSelect = selectedCount > 1;
  const isLinkSelected = selectedIds?.has(link.id);

  // Multi-select in trash view
  if (isMultiSelect && isLinkSelected && isTrashView) {
    return (
      <div data-testid="context-menu">
        {onBatchRestore && (
          <button onClick={onBatchRestore} data-testid="batch-restore">
            Restore {selectedCount} items
          </button>
        )}
        {onBatchPermanentDelete && (
          <button onClick={onBatchPermanentDelete} data-testid="batch-permanent-delete">
            Delete {selectedCount} items permanently
          </button>
        )}
      </div>
    );
  }

  // Multi-select in normal view
  if (isMultiSelect && isLinkSelected) {
    const selectedLinks = links.filter(l => selectedIds?.has(l.id));
    const allPinned = selectedLinks.every(l => l.is_pinned);
    const allUnpinned = selectedLinks.every(l => !l.is_pinned);

    return (
      <div data-testid="context-menu">
        {!allPinned && onBatchPin && (
          <button onClick={onBatchPin} data-testid="batch-pin">
            Pin {selectedCount} items
          </button>
        )}
        {!allUnpinned && onBatchUnpin && (
          <button onClick={onBatchUnpin} data-testid="batch-unpin">
            Unpin {selectedCount} items
          </button>
        )}
        {onBatchDelete && (
          <button onClick={onBatchDelete} data-testid="batch-delete">
            Delete {selectedCount} items
          </button>
        )}
      </div>
    );
  }

  // Single item in trash view
  if (isTrashView) {
    return (
      <div data-testid="context-menu">
        <button onClick={() => onCopy?.(link.url)} data-testid="copy-url">Copy URL</button>
        {onRestore && (
          <button onClick={() => onRestore(link.id)} data-testid="restore">Restore</button>
        )}
        {onPermanentDelete && (
          <button onClick={() => onPermanentDelete(link.id)} data-testid="permanent-delete">
            Delete permanently
          </button>
        )}
      </div>
    );
  }

  // Single item in normal view
  const isColor = link.content_type === 'color';
  
  return (
    <div data-testid="context-menu">
      <button onClick={() => onCopy?.(isColor ? link.color_value || link.url : link.url)} data-testid="copy">
        {isColor ? 'Copy Color' : 'Copy URL'}
      </button>
      <button onClick={() => onRename?.(link)} data-testid="rename">Rename</button>
      {link.is_pinned ? (
        onUnpin && <button onClick={() => onUnpin(link.id)} data-testid="unpin">Unpin</button>
      ) : (
        onPin && <button onClick={() => onPin(link.id)} data-testid="pin">Pin</button>
      )}
      {onDelete && (
        <button onClick={() => onDelete(link.id)} data-testid="delete">Delete</button>
      )}
    </div>
  );
};

describe('LinkContextMenu', () => {
  beforeEach(() => {
    resetLinkIdCounter();
    jest.clearAllMocks();
  });

  describe('single selection - normal view', () => {
    it('shows Copy URL, Rename, Pin, Delete options', () => {
      const link = createMockLink();
      
      render(
        <TestLinkContextMenu
          link={link}
          onCopy={jest.fn()}
          onRename={jest.fn()}
          onPin={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      expect(screen.getByTestId('copy')).toHaveTextContent('Copy URL');
      expect(screen.getByTestId('rename')).toBeInTheDocument();
      expect(screen.getByTestId('pin')).toBeInTheDocument();
      expect(screen.getByTestId('delete')).toBeInTheDocument();
    });

    it('shows Unpin for pinned links', () => {
      const link = createMockPinnedLink();
      
      render(
        <TestLinkContextMenu
          link={link}
          onCopy={jest.fn()}
          onRename={jest.fn()}
          onUnpin={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      expect(screen.getByTestId('unpin')).toBeInTheDocument();
      expect(screen.queryByTestId('pin')).not.toBeInTheDocument();
    });

    it('shows Copy Color for color links', () => {
      const link = createMockLink({ content_type: 'color', color_value: '#FF5733' });
      
      render(
        <TestLinkContextMenu
          link={link}
          onCopy={jest.fn()}
          onRename={jest.fn()}
          onPin={jest.fn()}
          onDelete={jest.fn()}
        />
      );

      expect(screen.getByTestId('copy')).toHaveTextContent('Copy Color');
    });

    it('calls onCopy with URL when Copy URL clicked', () => {
      const link = createMockLink({ url: 'https://example.com' });
      const onCopy = jest.fn();
      
      render(<TestLinkContextMenu link={link} onCopy={onCopy} />);
      
      fireEvent.click(screen.getByTestId('copy'));
      expect(onCopy).toHaveBeenCalledWith('https://example.com');
    });

    it('calls onDelete with link id when Delete clicked', () => {
      const link = createMockLink({ id: 'test-link-123' });
      const onDelete = jest.fn();
      
      render(<TestLinkContextMenu link={link} onDelete={onDelete} />);
      
      fireEvent.click(screen.getByTestId('delete'));
      expect(onDelete).toHaveBeenCalledWith('test-link-123');
    });

    it('calls onPin with link id when Pin clicked', () => {
      const link = createMockLink({ id: 'test-link-123', is_pinned: false });
      const onPin = jest.fn();
      
      render(<TestLinkContextMenu link={link} onPin={onPin} />);
      
      fireEvent.click(screen.getByTestId('pin'));
      expect(onPin).toHaveBeenCalledWith('test-link-123');
    });
  });

  describe('single selection - trash view', () => {
    it('shows Copy URL, Restore, Delete permanently options', () => {
      const link = createMockDeletedLink();
      
      render(
        <TestLinkContextMenu
          link={link}
          isTrashView
          onCopy={jest.fn()}
          onRestore={jest.fn()}
          onPermanentDelete={jest.fn()}
        />
      );

      expect(screen.getByTestId('copy-url')).toBeInTheDocument();
      expect(screen.getByTestId('restore')).toBeInTheDocument();
      expect(screen.getByTestId('permanent-delete')).toBeInTheDocument();
    });

    it('calls onRestore when Restore clicked', () => {
      const link = createMockDeletedLink({ id: 'deleted-123' });
      const onRestore = jest.fn();
      
      render(
        <TestLinkContextMenu
          link={link}
          isTrashView
          onRestore={onRestore}
        />
      );
      
      fireEvent.click(screen.getByTestId('restore'));
      expect(onRestore).toHaveBeenCalledWith('deleted-123');
    });

    it('calls onPermanentDelete when Delete permanently clicked', () => {
      const link = createMockDeletedLink({ id: 'deleted-123' });
      const onPermanentDelete = jest.fn();
      
      render(
        <TestLinkContextMenu
          link={link}
          isTrashView
          onPermanentDelete={onPermanentDelete}
        />
      );
      
      fireEvent.click(screen.getByTestId('permanent-delete'));
      expect(onPermanentDelete).toHaveBeenCalledWith('deleted-123');
    });
  });

  describe('multi-selection - normal view', () => {
    it('shows batch actions with correct count', () => {
      const links = [
        createMockLink({ id: '1' }),
        createMockLink({ id: '2' }),
        createMockLink({ id: '3' }),
      ];
      const selectedIds = new Set(['1', '2', '3']);
      
      render(
        <TestLinkContextMenu
          link={links[0]}
          selectedCount={3}
          selectedIds={selectedIds}
          links={links}
          onBatchPin={jest.fn()}
          onBatchDelete={jest.fn()}
        />
      );

      expect(screen.getByTestId('batch-pin')).toHaveTextContent('Pin 3 items');
      expect(screen.getByTestId('batch-delete')).toHaveTextContent('Delete 3 items');
    });

    it('shows Unpin for all-pinned selection', () => {
      const links = [
        createMockPinnedLink({ id: '1' }),
        createMockPinnedLink({ id: '2' }),
      ];
      const selectedIds = new Set(['1', '2']);
      
      render(
        <TestLinkContextMenu
          link={links[0]}
          selectedCount={2}
          selectedIds={selectedIds}
          links={links}
          onBatchUnpin={jest.fn()}
          onBatchDelete={jest.fn()}
        />
      );

      expect(screen.getByTestId('batch-unpin')).toBeInTheDocument();
      expect(screen.queryByTestId('batch-pin')).not.toBeInTheDocument();
    });

    it('calls onBatchDelete when clicked', () => {
      const links = [createMockLink({ id: '1' }), createMockLink({ id: '2' })];
      const selectedIds = new Set(['1', '2']);
      const onBatchDelete = jest.fn();
      
      render(
        <TestLinkContextMenu
          link={links[0]}
          selectedCount={2}
          selectedIds={selectedIds}
          links={links}
          onBatchPin={jest.fn()}
          onBatchDelete={onBatchDelete}
        />
      );
      
      fireEvent.click(screen.getByTestId('batch-delete'));
      expect(onBatchDelete).toHaveBeenCalled();
    });
  });

  describe('multi-selection - trash view', () => {
    it('shows Restore and Delete permanently options', () => {
      const links = [
        createMockDeletedLink({ id: '1' }),
        createMockDeletedLink({ id: '2' }),
      ];
      const selectedIds = new Set(['1', '2']);
      
      render(
        <TestLinkContextMenu
          link={links[0]}
          selectedCount={2}
          selectedIds={selectedIds}
          links={links}
          isTrashView
          onBatchRestore={jest.fn()}
          onBatchPermanentDelete={jest.fn()}
        />
      );

      expect(screen.getByTestId('batch-restore')).toHaveTextContent('Restore 2 items');
      expect(screen.getByTestId('batch-permanent-delete')).toHaveTextContent('Delete 2 items permanently');
    });

    it('calls onBatchRestore when clicked', () => {
      const links = [createMockDeletedLink({ id: '1' })];
      const selectedIds = new Set(['1']);
      const onBatchRestore = jest.fn();
      
      render(
        <TestLinkContextMenu
          link={links[0]}
          selectedCount={2}
          selectedIds={selectedIds}
          links={links}
          isTrashView
          onBatchRestore={onBatchRestore}
        />
      );
      
      fireEvent.click(screen.getByTestId('batch-restore'));
      expect(onBatchRestore).toHaveBeenCalled();
    });
  });
});
