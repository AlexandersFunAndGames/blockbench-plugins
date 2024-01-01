(function () {

    let animationsToExport = [];

// Registers the plugin
Plugin.register("advanced_animation_exporter", {
    title: "Alexander's Advanced Animation Exporter",
    author: "Alexander's Fun and Games",
    icon: "fa-clapperboard",
    description: "Exports animations to Java code for use with Alexander's Advanced Animation Utils",
    about: "This plugin adds the ability to export animations to Java code for use with Alexander's Advanced Animation Utils, which, among other things, allows for Molang to be used in mods for Minecraft: Java Edition"
            + "<br/><br/>The plugin also adds the Display tab to the Modded Entity format, which can be useful if you want to use an entity model for an item"
        + "<br/><br/>More information about Alexander's Advanced Animation Utils is available at https://github.com/AlexandersFunAndGames/Advanced-Animation-Utils/tree/main",
    version: "1.0.0",
    variant: "both",
    tags: ["Minecraft: Java Edition", "Animation", "Exporter"],
    onload() {
        // Adds Animation Mode and Display Mode to the Modded Entity format
        Formats.modded_entity.animation_mode = true;
        Formats.modded_entity.display_mode = true;
        //MenuBar.menus.get("export_advanced_animations");

        // Adds the plugin's menu button
        menuButton = new Action("export_advanced_animations", {
            name: "Export Advanced Animations",
            description: "Export animations to Java code for use with Alexander's Advanced Animation Utils",           
            icon: "fa-file-export",
            condition: () => Format.animation_mode,

            click() {
                chooseAnimationsToExport();
            },
        });
        MenuBar.addAction(menuButton, "file.export");
    },
    onunload() {
        // Removes Animation Mode and Display Mode from the Modded Entity format
        Formats.modded_entity.animation_mode = false;
        Formats.modded_entity.display_mode = false;

        // Removes the plugin's menu button
        menuButton.delete();
    },
});

    // Allows the user to choose the animations to be exported
    function chooseAnimationsToExport() {
        let form = {};
        let keys = [];
        let animations = Animation.all.slice();
        if (Format.animation_files) animations.sort((a1, a2) => a1.path.hashCode() - a2.path.hashCode());
        animations.forEach(animation => {
            let key = animation.name;
            keys.push(key)
            form[key.hashCode()] = { label: key, type: 'checkbox', value: true };
        })

        // Creates the dialog box
        let dialog = new Dialog("select_animations", {
            id: "select_animations",
            title: "Select Animations to Export",
            form,
            onConfirm(form_result) {
                dialog.hide();
                keys = keys.filter(key => form_result[key.hashCode()]);
                let animations = keys.map(k => Animation.all.find(anim => anim.name == k));

                animationsToExport = animations;

                Blockbench.export({
                    type: "Java File",
                    extensions: ["java"],
                    name: createFileName(Project.name),
                    content: createFileText(),
                });
            },
        })
        form.select_all_none = {
            type: 'buttons',
            buttons: ['generic.select_all', 'generic.select_none'],
            click(index) {
                let values = {};
                keys.forEach(key => values[key.hashCode()] = (index == 0));
                dialog.setFormValues(values);
            }
        }
        dialog.show();
    }

    // Creates the text for the exported file
    function createFileText() {
        let text = "public class " + createFileName(Project.name) + " {";

        // Registers all animations
        for (const animation of animationsToExport) {
            text += "\n\npublic static final AdvancedAnimationDefinition " + animation.name.toUpperCase() + " = AdvancedAnimationDefinition.Builder.withLength(" + animation.length + "F)";          

            // Adds animations for all animators
            for (const index in animation.animators) {
                const animator = animation.animators[index];
                if (!(animator instanceof BoneAnimator)) continue;

                // Adds animations for each target
                text += createTarget(animator, animator.rotation, "ROTATION");
                text += createTarget(animator, animator.position, "POSITION");
                text += createTarget(animator, animator.scale, "SCALE");               
            }
            text += "\n.build();";
        }

        text += "\n}";      

        return text;
    }

    function createTarget(animator, target, targetName) {
        let text = "";
        let targetKeyframes = [];

        if (target.length) {
            text += "\n.addAnimation(\"" + animator.name + "\", new AdvancedAnimationChannel(AdvancedAnimationChannel.Targets." + targetName + ", new AdvancedKeyframe[] {";

            // Sorts all keyframes in chronological order
            for (const keyframe of target) {
                targetKeyframes.push(keyframe);
            }
            targetKeyframes.sort((a, b) => a.time - b.time)

            // Adds all keyframes
            for (const keyframe of targetKeyframes) {
                let x = keyframe.data_points[0].x.toString();
                let y = keyframe.data_points[0].y.toString();
                let z = keyframe.data_points[0].z.toString();

                text += createKeyframe(keyframe.time, x, y, z);
            }

            text += "\n}))";
        }

        return text;
    }

    function createKeyframe(time, x, y, z) {
        return "\nnew AdvancedKeyframe(" + time + "F, new AdvancedAnimationInstance((modifiers) -> { return " + fixValues(x) + "; }, (modifiers) -> { return " + fixValues(y) + "; }, (modifiers) -> { return " + fixValues(z) + "; }), AdvancedAnimationChannel.Interpolations.CATMULLROM),";
    }

    // Changes anything that could cause errors when exported
    function fixValues(value) {
        let text = "";

        // Changes Molang queries to modifiers
        for (let i = 0; i < value.length; i++) {
            if (value.substring(i, i + 6) == "query.") {
                let queryLength = 6;
                let query = "modifiers.get(\"";

                for (let i2 = i + 6; i2 < value.length; i2++) {
                    if ((/[a-zA-Z]/).test(value.charAt(i2)) || value.charAt(i2) == "_") {
                        queryLength++;
                        query += value.charAt(i2);
                    } else {
                        query += "\") ";
                        break;
                    }
                }
                text += query;
                i += queryLength;
            } else {
                text += value.charAt(i);
            }
        }

        // Changes any empty values to 0
        if (text.length <= 0 || text == "" || text == "\n") {
            text = "0";
        }

        // Changes references to Math to references to the vanilla Mth class
        text = text.replaceAll("Math", "Mth");

        return text;
    }

    // Creates a name for the file that matches the normal java file naming convention
    function createFileName(value) {
        let text = "";

        // Changes the first character and all letters after underscores to be upper case
        for (let i = 0; i < value.length; i++) {
            if (i == 0 || text.charAt(i - 1) == "_") {
                text += value.charAt(i).toUpperCase();
            } else {
                text += value.charAt(i);
            }
        }

        // Removes all underscores
        text = text.replaceAll("_", "");

        text += "AdvancedAnimations";

        return text;
    }
})();