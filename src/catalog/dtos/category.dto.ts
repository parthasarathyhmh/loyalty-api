import { Paginated } from '../../common/listing/pagination';
import { RewardItem } from './summary.dto';

export class CategoryResponse extends Paginated<RewardItem> {
  id: number;
  name: string;
  icon: string;
}
