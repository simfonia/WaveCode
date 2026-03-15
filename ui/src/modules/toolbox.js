/**
 * WaveCode Toolbox Definition - 對齊 #processing 分類
 */

export const WaveCodeToolbox = {
    'kind': 'categoryToolbox',
    'contents': [
        // 1. 邏輯與控制
        {
            'kind': 'category',
            'name': '%{BKY_CAT_LOGIC}',
            'colour': '%{BKY_LOGIC_HUE}',
            'contents': [
                { 'kind': 'block', 'type': 'logic_compare' },
                { 'kind': 'block', 'type': 'logic_operation' },
                { 'kind': 'block', 'type': 'logic_boolean' }
            ]
        },
        {
            'kind': 'category',
            'name': '%{BKY_CAT_LOOPS}',
            'colour': '%{BKY_LOOPS_HUE}',
            'contents': [
                {
                    'kind': 'block',
                    'type': 'controls_repeat_ext',
                    'inputs': { 'TIMES': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 4 } } } }
                },
                { 'kind': 'block', 'type': 'controls_whileUntil' },
                { 'kind': 'block', 'type': 'controls_for' }
            ]
        },

        { 'kind': 'sep' },

        // 2. 數學與變數
        {
            'kind': 'category',
            'name': '%{BKY_CAT_MATH}',
            'colour': '%{BKY_MATH_HUE}',
            'contents': [
                { 'kind': 'block', 'type': 'math_number' },
                { 'kind': 'block', 'type': 'math_arithmetic' },
                { 'kind': 'block', 'type': 'math_random_int' }
            ]
        },
        {
            'kind': 'category',
            'name': '%{BKY_CAT_TEXT}',
            'colour': '%{BKY_TEXT_HUE}',
            'contents': [
                { 'kind': 'block', 'type': 'text' },
                { 'kind': 'block', 'type': 'text_join' },
                { 'kind': 'block', 'type': 'text_length' },
                { 'kind': 'block', 'type': 'text_isEmpty' },
                { 'kind': 'block', 'type': 'wc_text_print' }
            ]
        },
        {
            'kind': 'category',
            'name': '%{BKY_CAT_VARIABLES}',
            'custom': 'VARIABLE',
            'colour': '%{BKY_VARIABLES_HUE}'
        },
        {
            'kind': 'category',
            'name': '%{BKY_CAT_FUNCTIONS}',
            'custom': 'PROCEDURE',
            'colour': '%{BKY_FUNCTIONS_HUE}'
        },

        { 'kind': 'sep' },

        // 3. 音源定義 (Sound Sources)
        {
            'kind': 'category',
            'name': '%{BKY_CAT_SOUND_SOURCES}',
            'colour': '%{BKY_SOUND_SOURCES_HUE}',
            'contents': [
                { 'kind': 'block', 'type': 'audio_instrument' },
                { 'kind': 'block', 'type': 'audio_component_osc' },
                { 'kind': 'block', 'type': 'audio_component_sampler' }
            ]
        },

        // 4. 樂器控制 (Instrument Control)
        {
            'kind': 'category',
            'name': '%{BKY_CAT_INSTRUMENT_CONTROL}',
            'colour': '%{BKY_INSTRUMENT_CONTROL_HUE}',
            'contents': [
                { 'kind': 'block', 'type': 'audio_component_adsr' },
                { 'kind': 'block', 'type': 'audio_component_volume' }
            ]
        },

        // 5. 音訊效果 (Audio Effects)
        {
            'kind': 'category',
            'name': '%{BKY_CAT_EFFECTS}',
            'colour': '%{BKY_EFFECTS_HUE}',
            'contents': [
                { 'kind': 'block', 'type': 'audio_component_filter' }
            ]
        },

        // 6. 演奏指令 (Performance)
        {
            'kind': 'category',
            'name': '%{BKY_CAT_PERFORMANCE}',
            'colour': '%{BKY_PERFORMANCE_HUE}',
            'contents': [
                {
                    'kind': 'block',
                    'type': 'audio_play_note',
                    'inputs': {
                        'FREQ': { 'shadow': { 'type': 'audio_note' } },
                        'DUR': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 500 } } }
                    }
                },
                {
                    'kind': 'block',
                    'type': 'audio_play_note_async',
                    'inputs': {
                        'FREQ': { 'shadow': { 'type': 'audio_note' } },
                        'DUR': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 500 } } }
                    }
                },
                { 'kind': 'block', 'type': 'audio_wait', 'inputs': { 'MS': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 500 } } } } },
                { 'kind': 'block', 'type': 'audio_note' },
                { 'kind': 'block', 'type': 'audio_stop' }
            ]
        },

        { 'kind': 'sep' },

        // 7. 音訊電路 (保留)
        {
            'kind': 'category',
            'name': '%{BKY_CAT_AUDIO_TRAIN}',
            'colour': '#585858',
            'contents': [
                { 'kind': 'block', 'type': 'audio_oscillator' },
                { 'kind': 'block', 'type': 'audio_dac' }
            ]
        }
    ]
};
