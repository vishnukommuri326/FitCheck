import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

const AnalyzingAnimation = () => {
  const scaleAnims = useRef([...Array(3)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = scaleAnims.map((anim, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.out(Easing.ease),
            delay: index * 400,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 1200,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    });

    Animated.parallel(animations).start();
  }, [scaleAnims]);

  return (
    <View style={styles.container}>
      {scaleAnims.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.circle,
            {
              transform: [{ scale: anim }],
              opacity: anim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 0.7, 0],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F97316',
  },
});

export default AnalyzingAnimation;
