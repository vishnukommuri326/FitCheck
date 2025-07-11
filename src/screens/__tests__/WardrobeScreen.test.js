import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import WardrobeScreen from '../WardrobeScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Mock @react-navigation/native
const mockNavigate = jest.fn();
const mockSetParams = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    setParams: mockSetParams,
  }),
  useFocusEffect: jest.fn(),
}));

// Mock uuid for item IDs
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}));

describe('WardrobeScreen', () => {
  beforeEach(() => {
    AsyncStorage.getItem.mockClear();
    AsyncStorage.setItem.mockClear();
    mockNavigate.mockClear();
    mockSetParams.mockClear();
    useFocusEffect.mockImplementation(callback => callback()); // Immediately call focus effect
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify([])); // Default empty wardrobe
  });

  it('renders correctly', async () => {
    const { getByText, getByPlaceholderText } = render(<WardrobeScreen route={{ params: {} }} />);
    await waitFor(() => {
      expect(getByText('My Wardrobe')).toBeTruthy();
      expect(getByPlaceholderText('Search your wardrobe...')).toBeTruthy();
    });
  });

  it('adds a new item and displays it', async () => {
    const newItem = {
      id: 'item-1',
      itemName: 'Blue T-Shirt',
      itemType: 'Tops',
      itemColor: 'Blue',
      imageUri: 'file://path/to/image.jpg',
      isFavorite: false,
    };

    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify([])); // Initial empty
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify([newItem])); // After adding

    const { getByText, queryByText } = render(<WardrobeScreen route={{ params: { newItemAdded: true, newItem } }} />);

    await waitFor(() => {
      expect(getByText('Blue T-Shirt')).toBeTruthy();
      expect(getByText('Tops')).toBeTruthy();
      expect(queryByText('No items found')).toBeNull();
    });
  });

  it('toggles favorite status of an item', async () => {
    const initialItem = {
      id: 'item-1',
      itemName: 'Red Dress',
      itemType: 'Dresses',
      itemColor: 'Red',
      imageUri: 'file://path/to/image.jpg',
      isFavorite: false,
    };
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify([initialItem]));

    const { getByText, getByTestId, rerender } = render(<WardrobeScreen route={{ params: {} }} />);

    await waitFor(() => expect(getByText('Red Dress')).toBeTruthy());

    // Find the favorite button for the item
    const favoriteButton = getByTestId(`favorite-button-${initialItem.id}`);
    await act(async () => {
      fireEvent.press(favoriteButton);
    });

    // Expect AsyncStorage.setItem to be called with the updated item
    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'wardrobeItems',
        JSON.stringify([{ ...initialItem, isFavorite: true }])
      );
    });

    // Simulate re-render with updated data
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify([{ ...initialItem, isFavorite: true }]));
    rerender(<WardrobeScreen route={{ params: {} }} />);

    // Check if the heart icon is filled (indicating favorited)
    expect(getByTestId(`favorite-icon-${initialItem.id}`).props.name).toBe('heart');

    // Toggle back
    await act(async () => {
      fireEvent.press(favoriteButton);
    });
    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'wardrobeItems',
        JSON.stringify([{ ...initialItem, isFavorite: false }])
      );
    });
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify([{ ...initialItem, isFavorite: false }]));
    rerender(<WardrobeScreen route={{ params: {} }} />);
    expect(getByTestId(`favorite-icon-${initialItem.id}`).props.name).toBe('heart-outline');
  });

  it('filters items by Favorites category', async () => {
    const item1 = { id: 'item-1', itemName: 'Fav Shirt', itemType: 'Tops', itemColor: 'White', imageUri: 'uri1', isFavorite: true };
    const item2 = { id: 'item-2', itemName: 'Non-Fav Pants', itemType: 'Bottoms', itemColor: 'Black', imageUri: 'uri2', isFavorite: false };
    const item3 = { id: 'item-3', itemName: 'Another Fav', itemType: 'Dresses', itemColor: 'Green', imageUri: 'uri3', isFavorite: true };

    AsyncStorage.getItem.mockResolvedValue(JSON.stringify([item1, item2, item3]));

    const { getByText, queryByText, rerender } = render(<WardrobeScreen route={{ params: {} }} />);

    await waitFor(() => {
      expect(getByText('Fav Shirt')).toBeTruthy();
      expect(getByText('Non-Fav Pants')).toBeTruthy();
      expect(getByText('Another Fav')).toBeTruthy();
    });

    // Select Favorites category
    await act(async () => {
      fireEvent.press(getByText('Favorites'));
    });

    await waitFor(() => {
      expect(getByText('Fav Shirt')).toBeTruthy();
      expect(queryByText('Non-Fav Pants')).toBeNull(); // Should not be visible
      expect(getByText('Another Fav')).toBeTruthy();
    });

    // Select All category
    await act(async () => {
      fireEvent.press(getByText('All'));
    });

    await waitFor(() => {
      expect(getByText('Fav Shirt')).toBeTruthy();
      expect(getByText('Non-Fav Pants')).toBeTruthy();
      expect(getByText('Another Fav')).toBeTruthy();
    });
  });
});