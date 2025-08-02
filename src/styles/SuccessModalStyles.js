
import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.85,
    maxWidth: 350,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingTop: 32, // Add more padding at the top
    paddingBottom: 32, // Ensure enough space at the bottom
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 15,
  },
  iconContainer: {
    marginBottom: 20, // Increase space below the icon
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 12, // Adjust spacing
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24, // Space above the buttons
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    flexDirection: 'column',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#F97316',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    width: '80%',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F7F8FA',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    width: '80%',
  },
  secondaryButtonText: {
    color: '#333333',
    fontSize: 15,
    fontWeight: '500',
  },
});
