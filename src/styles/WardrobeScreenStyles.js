
import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const itemWidth = (width - 40) / 2; // Two items per row with spacing

export default StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 5,
    backgroundColor: '#f7fac',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: '#2d3748',
    textAlign: 'center',
  },
  list: {
    width: '100%',
  },
  itemContainer: {
    backgroundColor: 'white',
    margin: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
    width: itemWidth,
  },
  itemImage: {
    width: '100%',
    height: itemWidth, // Make the image square
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  itemInfo: {
    padding: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a5568',
  },
  itemDetails: {
    fontSize: 12,
    color: '#718096',
    marginTop: 4,
  },
});
