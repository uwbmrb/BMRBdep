import { Entry } from './entry';
import { Loop } from './loop';
import { cleanValue } from './nmrstar';
import { Schema } from './schema';
import { SaveframeTag } from './tag';

export class Saveframe {
  name: string;
  category: string;
  tag_prefix: string;
  tags: SaveframeTag[];
  loops: Loop[];
  parent: Entry;

  constructor (name: string,
               category: string,
               tag_prefix: string,
               parent: Entry,
               tags: SaveframeTag[] = [],
               loops: Loop[] = []) {
    this.name = name;
    this.category = category;
    this.tag_prefix = tag_prefix;
    this.tags = tags;
    this.loops = loops;
    this.parent = parent;
  }

  duplicate(clear_values: boolean = false) {
    const next_this_type = this.parent.getSaveframesByCategory(this.category).length + 1;
    const new_frame = new Saveframe(this.name + '_' + next_this_type, this.category, this.tag_prefix, this.parent);

    // Copy the tags
    const tag_copy: SaveframeTag[] = [];
    for (const tag of this.tags) {
      let val = clear_values ? null : tag.value;
      if (!clear_values && tag.name === 'Sf_framecode') {
        val = new_frame.name;
      }
      tag_copy.push(new SaveframeTag(tag.name, val, new_frame));
    }
    new_frame.tags = tag_copy;

    // Copy the loops
    for (const loop of this.loops) {
      const nl = loop.duplicate(clear_values);
      nl.refresh();
      new_frame.addLoop(nl);
    }

    const my_pos = this.parent.saveframes.indexOf(this);
    this.parent.addSaveframe(new_frame, my_pos + 1);
  }

  toJSON(key) {
    // Clone object to prevent accidentally performing modification on the original object
    const cloneObj = { ...this as Saveframe };
    delete cloneObj.parent;

    return cloneObj;
  }

  addTag(name: string, value: string) {
    this.tags.push(new SaveframeTag(name, value, this));
  }

  addTags(tag_list: string[][]) {
    for (const tag_pair of tag_list) {
      if (tag_pair[0]) {
        this.addTag(tag_pair[0], tag_pair[1]);
      } else {
        this.addTag(tag_pair['name'], tag_pair['value']);
      }
    }
  }

  addLoop(loop: Loop) {
    this.loops.push(loop);
  }

  getID(): string {
    let entry_id_tag = 'Entry_ID';
    if (this.category === 'entry_information') {
      entry_id_tag = 'ID';
    }
    for (const tag of this.tags) {
      if (tag['name'] === entry_id_tag) {
        return tag['value'];
      }
    }
  }

  refresh() {
    for (const tag of this.tags) {
      tag.updateTagStatus();
    }
  }

  print(): string {
    let width = 0;

    for (const tag of this.tags) {
      if (tag.name.length > width) {
          width = tag.name.length;
      }
    }
    width += this.tag_prefix.length + 2;

    // Print the saveframe
    let ret_string = sprintf('save_%s\n', this.name);
    const pstring = sprintf('   %%-%ds  %%s\n', width);
    const mstring = sprintf('   %%-%ds\n;\n%%s;\n', width);

    const tag_prefix = this.tag_prefix;

    for (const tag of this.tags) {
      const cleaned_tag = cleanValue(tag.value);

      if (cleaned_tag.indexOf('\n') === -1) {
          ret_string +=  sprintf(pstring, tag_prefix + '.' + tag.name, cleaned_tag);
      } else {
          ret_string +=  sprintf(mstring, tag_prefix + '.' + tag.name, cleaned_tag);
      }
    }

    for (const loop of this.loops) {
        ret_string += loop.print();
    }

    return ret_string + 'save_\n';
  }

}

export function saveframeFromJSON(jdata: Object, parent: Entry): Saveframe {
  const test: Saveframe = new Saveframe(jdata['name'],
                                        jdata['category'],
                                        jdata['tag_prefix'],
                                        parent);
  test.addTags(jdata['tags']);
  for (const l of jdata['loops']) {
    const new_loop = new Loop(l['category'], l['tags'], l['data'], test);
    test.addLoop(new_loop);
  }
  return test;
}
/* probably obsolete but kept for now for reference
export function saveframesFromJSON(jdata: Object[]): Saveframe[] {
  const saveframes = [];

  for (const sf_json of jdata) {
    saveframes.push(saveframeFromJSON(sf_json));
  }
  return saveframes;
}

*/