import { getColorFromFacelet, calculateColors, getCubeState } from './cube';

// Test cases for extracted functions
if (typeof jest !== 'undefined') {
    describe('Rubik\'s Cube Helper Functions', () => {
        test('getColorFromFacelet returns correct color', () => {
            expect(getColorFromFacelet('U')).toBe('white');
            expect(getColorFromFacelet('R')).toBe('red');
            expect(getColorFromFacelet('F')).toBe('green');
            expect(getColorFromFacelet('L')).toBe('orange');
            expect(getColorFromFacelet('B')).toBe('blue');
            expect(getColorFromFacelet('D')).toBe('yellow');
        });

        test('calculateColors returns correct colors array', () => {
            const facelets = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';
            expect(calculateColors(-1, -1, -1, facelets)).toEqual(['white', null, null, 'orange', 'blue', null]);
            expect(calculateColors(1, 1, 1, facelets)).toEqual([null, 'red', 'green', null, null, 'yellow']);
        });

        test('getCubeState returns correct state array', () => {
            const mockCube = { asString: () => 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB' };
            const state = getCubeState(mockCube);
            expect(state.length).toBe(26); // 3x3x3 cube has 26 visible pieces
            expect(state[0]).toEqual({
                position: [-1, -1, -1],
                colors: ['white', null, null, 'orange', 'blue', null]
            });
        });
    });
}