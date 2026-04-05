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
                { 'kind': 'block', 'type': 'controls_if' },
                { 'kind': 'block', 'type': 'logic_compare' },
                { 'kind': 'block', 'type': 'logic_operation' },
                { 'kind': 'block', 'type': 'logic_negate' },
                { 'kind': 'block', 'type': 'logic_boolean' },
                { 'kind': 'block', 'type': 'logic_null' },
                { 'kind': 'block', 'type': 'logic_ternary' }
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
                {
                    'kind': 'block',
                    'type': 'controls_for',
                    'inputs': {
                        'FROM': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 1 } } },
                        'TO': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 10 } } },
                        'BY': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 1 } } }
                    }
                },
                { 'kind': 'block', 'type': 'controls_forEach' },
                { 'kind': 'block', 'type': 'controls_flow_statements' }
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
                {
                    'kind': 'block',
                    'type': 'math_arithmetic',
                    'inputs': {
                        'A': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 1 } } },
                        'B': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 1 } } }
                    }
                },
                { 'kind': 'block', 'type': 'math_single', 'inputs': { 'NUM': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 9 } } } } },
                { 'kind': 'block', 'type': 'math_trig', 'inputs': { 'NUM': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 45 } } } } },
                { 'kind': 'block', 'type': 'math_constant' },
                { 'kind': 'block', 'type': 'math_number_property', 'inputs': { 'NUMBER_TO_CHECK': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 0 } } } } },
                { 'kind': 'block', 'type': 'math_round', 'inputs': { 'NUM': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 3.1 } } } } },
                { 'kind': 'block', 'type': 'math_on_list' },
                { 'kind': 'block', 'type': 'math_modulo', 'inputs': { 'DIVIDEND': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 64 } } }, 'DIVISOR': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 10 } } } } },
                { 'kind': 'block', 'type': 'math_constrain', 'inputs': { 'VALUE': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 50 } } }, 'LOW': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 1 } } }, 'HIGH': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 100 } } } } },
                { 'kind': 'block', 'type': 'math_random_int', 'inputs': { 'FROM': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 1 } } }, 'TO': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 100 } } } } },
                { 'kind': 'block', 'type': 'math_random_float' }
            ]
        },
        {
            'kind': 'category',
            'name': '%{BKY_CAT_TEXT}',
            'colour': '%{BKY_TEXT_HUE}',
            'contents': [
                { 'kind': 'block', 'type': 'text' },
                { 'kind': 'block', 'type': 'text_join' },
                { 'kind': 'block', 'type': 'text_append', 'inputs': { 'TEXT': { 'shadow': { 'type': 'text' } } } },
                { 'kind': 'block', 'type': 'text_length', 'inputs': { 'VALUE': { 'shadow': { 'type': 'text', 'fields': { 'TEXT': 'abc' } } } } },
                { 'kind': 'block', 'type': 'text_isEmpty', 'inputs': { 'VALUE': { 'shadow': { 'type': 'text', 'fields': { 'TEXT': '' } } } } },
                { 'kind': 'block', 'type': 'wc_text_print' },
                { 'kind': 'block', 'type': 'wc_comment' }
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
                { 'kind': 'block', 'type': 'wc_instrument' },
                { 'kind': 'block', 'type': 'wc_component_osc' },
                { 'kind': 'block', 'type': 'wc_component_sampler' }
            ]
        },

        // 4. 樂器控制 (Instrument Control)
        {
            'kind': 'category',
            'name': '%{BKY_CAT_INSTRUMENT_CONTROL}',
            'colour': '%{BKY_INSTRUMENT_CONTROL_HUE}',
            'contents': [
                { 'kind': 'block', 'type': 'wc_component_adsr' },
                { 'kind': 'block', 'type': 'wc_component_volume' }
            ]
        },

        // 5. 音訊效果 (Audio Effects)
        {
            'kind': 'category',
            'name': '%{BKY_CAT_EFFECTS}',
            'colour': '%{BKY_EFFECTS_HUE}',
            'contents': [
                { 'kind': 'block', 'type': 'wc_component_filter' }
            ]
        },

        // 6. 演奏指令 (Performance)
        {
            'kind': 'category',
            'name': '%{BKY_CAT_PERFORMANCE}',
            'colour': '%{BKY_PERFORMANCE_HUE}',
            'contents': [
                { 'kind': 'block', 'type': 'wc_perform' },
                {
                    'kind': 'block',
                    'type': 'wc_play_note',
                    'inputs': {
                        'FREQ': { 'shadow': { 'type': 'wc_note' } },
                        'DUR': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 500 } } }
                    }
                },
                {
                    'kind': 'block',
                    'type': 'wc_play_note_async',
                    'inputs': {
                        'FREQ': { 'shadow': { 'type': 'wc_note' } },
                        'DUR': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 500 } } }
                    }
                },
                { 'kind': 'block', 'type': 'wc_wait', 'inputs': { 'MS': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 500 } } } } },
                { 'kind': 'block', 'type': 'wc_note' },
                { 'kind': 'block', 'type': 'wc_stop' }
            ]
        }
    ]
};
