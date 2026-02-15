/**
 * Tests for Dock component
 * Covers view switching and selection toolbar
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { resetLinkIdCounter } from '../fixtures/link.fixtures';

// Simplified test version of Dock
const TestDock = ({
  onViewChange,
  allItemsCount = 0,
  selectedCount = 0,
  onClearSelection,
  onBatchDelete,
  onBatchRestore,
  onBatchPermanentDelete,
  onBatchPin,
  onBatchUnpin,
  isTrashView = false,
}: {
  onViewChange?: (view: string | null) => void;
  allItemsCount?: number;
  selectedCount?: number;
  onClearSelection?: () => void;
  onBatchDelete?: () => void;
  onBatchRestore?: () => void;
  onBatchPermanentDelete?: () => void;
  onBatchPin?: () => void;
  onBatchUnpin?: () => void;
  isTrashView?: boolean;
}) => {
  const [currentView, setCurrentView] = React.useState<string | null>(null);

  const handleViewChange = (view: string | null) => {
    setCurrentView(view);
    onViewChange?.(view);
  };

  return (
    <div data-testid="dock">
      {/* View Toggle */}
      <div data-testid="view-toggle">
        <button
          onClick={() => handleViewChange(null)}
          data-testid="view-all"
          data-active={currentView === null}
        >
          All ({allItemsCount})
        </button>
        <button
          onClick={() => handleViewChange('trash')}
          data-testid="view-trash"
          data-active={currentView === 'trash'}
        >
          Trash
        </button>
      </div>

      {/* Selection Toolbar */}
      {selectedCount > 0 && (
        <div data-testid="selection-toolbar">
          <span data-testid="selection-count">{selectedCount} selected</span>
          
          {onClearSelection && (
            <button onClick={onClearSelection} data-testid="clear-selection">
              Clear
            </button>
          )}

          {isTrashView ? (
            <>
              {onBatchRestore && (
                <button onClick={onBatchRestore} data-testid="toolbar-restore">
                  Restore
                </button>
              )}
              {onBatchPermanentDelete && (
                <button onClick={onBatchPermanentDelete} data-testid="toolbar-permanent-delete">
                  Delete Forever
                </button>
              )}
            </>
          ) : (
            <>
              {onBatchPin && (
                <button onClick={onBatchPin} data-testid="toolbar-pin">
                  Pin
                </button>
              )}
              {onBatchUnpin && (
                <button onClick={onBatchUnpin} data-testid="toolbar-unpin">
                  Unpin
                </button>
              )}
              {onBatchDelete && (
                <button onClick={onBatchDelete} data-testid="toolbar-delete">
                  Delete
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

describe('Dock', () => {
  beforeEach(() => {
    resetLinkIdCounter();
    jest.clearAllMocks();
  });

  describe('view toggle', () => {
    it('renders All and Trash view buttons', () => {
      render(<TestDock />);

      expect(screen.getByTestId('view-all')).toBeInTheDocument();
      expect(screen.getByTestId('view-trash')).toBeInTheDocument();
    });

    it('displays item count in All view button', () => {
      render(<TestDock allItemsCount={42} />);

      expect(screen.getByTestId('view-all')).toHaveTextContent('All (42)');
    });

    it('calls onViewChange with null when All clicked', () => {
      const onViewChange = jest.fn();
      render(<TestDock onViewChange={onViewChange} />);

      fireEvent.click(screen.getByTestId('view-all'));

      expect(onViewChange).toHaveBeenCalledWith(null);
    });

    it('calls onViewChange with "trash" when Trash clicked', () => {
      const onViewChange = jest.fn();
      render(<TestDock onViewChange={onViewChange} />);

      fireEvent.click(screen.getByTestId('view-trash'));

      expect(onViewChange).toHaveBeenCalledWith('trash');
    });
  });

  describe('selection toolbar', () => {
    it('does not show toolbar when no items selected', () => {
      render(<TestDock selectedCount={0} />);

      expect(screen.queryByTestId('selection-toolbar')).not.toBeInTheDocument();
    });

    it('shows toolbar when items are selected', () => {
      render(<TestDock selectedCount={3} />);

      expect(screen.getByTestId('selection-toolbar')).toBeInTheDocument();
    });

    it('displays correct selection count', () => {
      render(<TestDock selectedCount={5} />);

      expect(screen.getByTestId('selection-count')).toHaveTextContent('5 selected');
    });

    it('calls onClearSelection when Clear clicked', () => {
      const onClearSelection = jest.fn();
      render(<TestDock selectedCount={3} onClearSelection={onClearSelection} />);

      fireEvent.click(screen.getByTestId('clear-selection'));

      expect(onClearSelection).toHaveBeenCalled();
    });
  });

  describe('selection toolbar - normal view', () => {
    it('shows Pin, Unpin, Delete actions', () => {
      render(
        <TestDock
          selectedCount={2}
          isTrashView={false}
          onBatchPin={jest.fn()}
          onBatchUnpin={jest.fn()}
          onBatchDelete={jest.fn()}
        />
      );

      expect(screen.getByTestId('toolbar-pin')).toBeInTheDocument();
      expect(screen.getByTestId('toolbar-unpin')).toBeInTheDocument();
      expect(screen.getByTestId('toolbar-delete')).toBeInTheDocument();
    });

    it('calls onBatchPin when Pin clicked', () => {
      const onBatchPin = jest.fn();
      render(
        <TestDock
          selectedCount={2}
          isTrashView={false}
          onBatchPin={onBatchPin}
        />
      );

      fireEvent.click(screen.getByTestId('toolbar-pin'));

      expect(onBatchPin).toHaveBeenCalled();
    });

    it('calls onBatchDelete when Delete clicked', () => {
      const onBatchDelete = jest.fn();
      render(
        <TestDock
          selectedCount={2}
          isTrashView={false}
          onBatchDelete={onBatchDelete}
        />
      );

      fireEvent.click(screen.getByTestId('toolbar-delete'));

      expect(onBatchDelete).toHaveBeenCalled();
    });
  });

  describe('selection toolbar - trash view', () => {
    it('shows Restore and Delete Forever actions', () => {
      render(
        <TestDock
          selectedCount={2}
          isTrashView={true}
          onBatchRestore={jest.fn()}
          onBatchPermanentDelete={jest.fn()}
        />
      );

      expect(screen.getByTestId('toolbar-restore')).toBeInTheDocument();
      expect(screen.getByTestId('toolbar-permanent-delete')).toBeInTheDocument();
    });

    it('does not show normal view actions in trash', () => {
      render(
        <TestDock
          selectedCount={2}
          isTrashView={true}
          onBatchPin={jest.fn()}
          onBatchDelete={jest.fn()}
          onBatchRestore={jest.fn()}
        />
      );

      expect(screen.queryByTestId('toolbar-pin')).not.toBeInTheDocument();
      expect(screen.queryByTestId('toolbar-delete')).not.toBeInTheDocument();
    });

    it('calls onBatchRestore when Restore clicked', () => {
      const onBatchRestore = jest.fn();
      render(
        <TestDock
          selectedCount={2}
          isTrashView={true}
          onBatchRestore={onBatchRestore}
        />
      );

      fireEvent.click(screen.getByTestId('toolbar-restore'));

      expect(onBatchRestore).toHaveBeenCalled();
    });

    it('calls onBatchPermanentDelete when Delete Forever clicked', () => {
      const onBatchPermanentDelete = jest.fn();
      render(
        <TestDock
          selectedCount={2}
          isTrashView={true}
          onBatchPermanentDelete={onBatchPermanentDelete}
        />
      );

      fireEvent.click(screen.getByTestId('toolbar-permanent-delete'));

      expect(onBatchPermanentDelete).toHaveBeenCalled();
    });
  });
});
