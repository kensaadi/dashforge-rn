import { Text, View } from 'react-native';
import { render, screen } from '@testing-library/react-native';

/**
 * Toolchain smoke test.
 *
 * Asserts nothing about Dashforge. It exists so that a broken build
 * chain fails here, loudly and in one place, instead of surfacing as a
 * confusing failure inside a component test.
 *
 * What it actually proves:
 *  - the Babel/Jest transform handles TSX
 *  - `@react-native/jest-preset` resolves react-native
 *  - React and react-test-renderer are on the same exact version
 *    (a mismatch throws inside the reconciler, not at install time)
 */
describe('toolchain', () => {
  it('renders a React Native tree through the testing library', () => {
    render(
      <View>
        <Text>dashforge</Text>
      </View>,
    );
    expect(screen.getByText('dashforge')).toBeTruthy();
  });
});
