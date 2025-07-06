import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#FFF5F7', // Warm Pastels: pale rose background
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333333', // Warm Pastels: nearly black for title
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#FFAB91', // Warm Pastels: Soft Coral for border
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#FFFFFF', // Warm Pastels: white for input background
  },
});

export default styles;
