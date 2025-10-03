import { StyleSheet, Platform } from 'react-native';
import { getPlatformPadding, getStatusBarHeight, normalize } from './responsive';

export const GlobalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? getStatusBarHeight() : 0,
  },
  
  safeContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: getPlatformPadding(),
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: normalize(15),
    paddingHorizontal: getPlatformPadding(),
  },
  
  title: {
    fontSize: normalize(24),
    fontWeight: '600',
    color: '#333',
  },
  
  backButton: {
    fontSize: normalize(18),
    color: '#4a90e2',
    marginRight: normalize(20),
  },
  
  button: {
    backgroundColor: '#4a90e2',
    paddingVertical: normalize(12),
    paddingHorizontal: normalize(20),
    borderRadius: normalize(8),
    alignItems: 'center',
    marginVertical: normalize(5),
  },
  
  buttonText: {
    color: '#fff',
    fontSize: normalize(16),
    fontWeight: '600',
  },
  
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: normalize(8),
    paddingVertical: normalize(12),
    paddingHorizontal: normalize(15),
    fontSize: normalize(16),
    marginVertical: normalize(5),
    backgroundColor: '#fff',
  },
  
  card: {
    backgroundColor: '#fff',
    borderRadius: normalize(12),
    padding: normalize(15),
    marginVertical: normalize(8),
    marginHorizontal: getPlatformPadding(),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: normalize(15),
    paddingHorizontal: getPlatformPadding(),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  
  text: {
    fontSize: normalize(16),
    color: '#333',
  },
  
  smallText: {
    fontSize: normalize(14),
    color: '#666',
  },
  
  errorText: {
    fontSize: normalize(14),
    color: '#ff3b30',
    marginTop: normalize(5),
  },
  
  successText: {
    fontSize: normalize(14),
    color: '#4cd964',
    marginTop: normalize(5),
  },
});