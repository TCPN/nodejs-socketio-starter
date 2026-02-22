# TODO

## Bugs
- ~~in game 不能把名字改成空字串~~
- 如果 TAKE_POT 和 PUT_POT 分成兩個 effect 分別觸發，則會因為先觸發一個然後又觸發另一個導致放下又拿起來

## Improve
- ~~Press Enter to send 'my name' input~~
- can users use same name ?



## Important Features

- effect 的顯示
    - 公開 effect 要顯示在個人裝置和 host 畫面
    - 私人 effect 只顯示在個人裝置
        - 私人 effect 就要分對 "誰" (玩家/隊伍)
- effect 有分對象: 對角色的、對隊伍的、對玩家的
    - 其實不用分，因為就分公開和私人
        - 私人效果: 首先要確定有沒有符合 trigger 條件 (「選擇」/「結果」/「行為」/「位置」)
    - 對玩家的效果，目前的規劃中全部都是以「選擇」trigger
    - 對玩家個人的效果，目前只會顯示在玩家的裝置上
    activated
    deactivated

- trigger 有分成
    - 要真的踩上去該「位置」
    - 要投票「結果」是往那邊動、才會觸發的
    (結果跟位置的差異情境: (1) 當面對障礙物時，位置不會到 (2) 某些技能發動時，雖然選擇了該方向，也不會踩上去，可能會飛過去 (3) 被蟲或物品推動，所以沒有前進(如果 trigger 是綁在地板上，被蟲阻擋，好像不應該觸發；目前會有綁在地板上的 trigger 嗎？隨機產生的地磚分數好像算是？))
        - 如果障礙物就是地板的一部份，應該不前進也要觸發 (或是想成碰到了，產生效果、退回原位)
        - 如果障礙物是物品，好像可以也在碰到時觸發
        - 如果障礙物是蟲，總覺得不應該觸發，雖然不是很重要但先不要做這個不觸發好了
    - 所以
        - 「公開」效果一定是以角色「行為」結果 trigger，或是以投票「結果」 trigger
            - 以「行為」trigger，就是看角色有沒有踩上去、撞上去、摸它拿它
            - 以「結果」trigger，就是看投票結果的方向 (四向+不動)
        - 「私人」效果可以是以玩家「選擇」trigger，也可以是以角色「行為」，也可以是投票「結果」
            - 但效果的對象一定是玩家個人
            - 不能是影響全體的效果，有點不公平????
            - 不過，只顯示給私人的效果，如果會影響到整個遊戲，或是角色，就會變成該玩家必須要提出來溝通的風險，也滿有趣的
            - 花、爐等東西會固定帶給玩家私人效果？觸發方法一定是「行為」?還是「選擇」
    - 只要 A 「選擇」投給他，就會對 A 觸發的
        - 這個的對象一定是對玩家
    - 「行為」跟「位置」好像是類似的，差別是:
        - 行為應該是做了之後角色沒動
        - 位置是不管角色有沒有動，看最後的位置是不是在磚上
        - 同一個東西可能會可以被「行為」或「位置」觸發，但觸發了「行為」就應該不要踩上去，而要觸發「位置」就一定要已經踩在上面
        - 如果一個技能可以把本來是障礙物的東西變成不是障礙物，那之後就不應該觸發「行為」trigger
        - 如果碰到障礙物，就有可能又觸發障礙物的「行為」trigger，又觸發原本格子的「位置」trigger
- 各種 trigger 可以放在哪裡？
    - CHOOSE
        - global
        - stand cell
    - VOTE_RESULT
        - global
        - stand cell
    - ACTION
        - global
        - stand cell
    - INTERACT
        - touch cell
        - touch cell item
    - STAND
        - stand cell
        - stand cell item
- 上面的各種 trigger 其實是 transform 過程的不同階段 (stage/phase)
    - CHOOSE: 首先投票一結束就是這個階段
    - VOTE_RESULT: 投票結果代表玩家投出來的方向，因為投票規則、玩家技能、票數加權，都會影響此結果
    - ACTION: 因為技能或其他效果的影響，投票結果有可能不會等於最後的 action
    - MOVE: 如果沒有移動，就不會觸發此階段；參數是方向、起始位置、最終位置
    - INTERACT: 如果沒有碰到任何物體，就不會觸發此階段
    - STAND: 最終會觸發此階段，根據角色最後站的位置發動
- PROBLEM: 我想要讓 effect 裡面可以直接改 state 裡面的狀態和增減 effects，但是這樣就會讓依序觸發 effects 的過程變得複雜 (不想一加入新的 effect 就馬上被觸發)
    - 這樣說起來，effects 記錄在 state 確實不太對勁，但應該怎麼記才是好的？
        - 方便把 state 存下來
        - 方便把 state 重新載入
        - 載入的 state 要可以對應回正確的 effects 組合
            - 考慮到重新載入成正確的 effects 組合，就覺得所有 effects 都放在 global 上才會比較方便管理
            - 但是都放在 global，就會變成每次觸發 events 都要把所有的 effects 檢查一遍 (可能會變得很複雜？容易出錯)
            - 有部分 effects 放在 cell 或 item，就表示沒有 stand 或 interact 這些 effects 的時候，可能不需要檢查這些地方 (不過如果允許 CHOOSE/VOTE_RESULT effects 存在 cell 上，這個優點其實就有點沒效)
            - 因為在 effects 物件上記住 enabled 狀態感覺會讓狀態物件變得複雜又混亂，所以可能直接以是否記錄在 state 裡面來表示 enabled 會比較直接？但是就會產生另外的複雜度：要 disable 效果時，會很難找到該 effects
            - 基於讓 effects 好找這個想法，我覺得應該建立一個 effect manager 物件，負責有效率地找到指定的 effect
                - 找到 effect 的方法與可指定的條件可以由此物件定義
                    - by name
                    - by label
                    - by trigger stage
                    - by cell: effect 上要記錄是屬於此 cell (triggers? parent? owner)
                    - by item: effect 上要紀錄是屬於此 item
                - 將 effects state 寫出與載入的方法也由此定義
                - 提供一個 makeEffect 的方法: 在 pool 裡增加一個 effect，同時也回傳這個 effect 物件或key，讓我們可以把該 effect export 出去讓其他地方簡單的取用，這些命名的 effect 就是 namedEffects ?
            - 如果有 effect manager，就不需要把目前 active 的 effects 存在 cell 或 item 上了??
                - 每一次投票時，只要把這次四個方向的 will trigger 的 effects 找出來，即可讓每個 user 看到四個方向的效果
                - 每次更新狀態時，還是要把每個 cell 會帶來的效果印出在地圖上，所以那些會在 cell 的 stand 或 interact 時觸發的特殊效果，仍然要寫進 state 並傳給 front end (但這是為了讓地圖上可以顯示提示)
                    - 目前會在地圖上顯示的提示
                        - 各隊的分數效果
                        - 對所有人的分數效果
                        - 故事任務的提示點
                        - 對角色的效果提示 (回血、受傷、道具、任務)
                    - cell 或 item 的 effect 要在 state 傳給 front end，但不用存進 cell，
                    - cell 或 item 的 effect 還是由 effect manager 寫成 state 存起來，
            - effect manager 必須是 global accessible? 否則 debug 或 local 存取的時候，沒辦法存取，反而會很麻煩
- 狀態轉換的過程
    - 觸發所有 CHOOSE effects
        - global
        - stand cell (應該很少見)
    - 根據投票規則、玩家技能、玩家道具、票數加權，計算投票結果
    - 觸發所有 VOTE_RESULTS effects
        - global
        - stand cell (應該很少見)
    - 根據玩家技能和其他效果，決定 character action
    - 觸發所有 ACTION effects
        - global
        - stand cell
    - 計算所有 movable subject 的移動意圖、預計落點，然後根據障礙物、以及所有移動意圖的交互作用，決定最終落點
    - (針對 character 的起始位置、最終位置、移動方向，觸發 MOVE effects (global))
    - 針對 character 接觸到的所有障礙物，觸發 INTERACT effects
    - 移動 character 和所有 movable subjects
    - 觸發所有 STAND effects
- 效果的發動順序
    - 觸發「選擇」 trigger
    - 發動技能
        - 消滅敵對
        - 角色回血
        - 改變移動方向/移動落點
        - 影響投票結果
    - 發動「結果」trigger
    - 發動「行為」trigger (也可以叫「接觸」)
        - 觸發物品效果 (物品、火、蟲)
            - 蟲可能會改變角色移動落點
        - 觸發地塊效果
            - 觸發「行為」trigger
            - 角色扣血
        - 角色可能死亡
        - 角色移動
    - 發動「位置」trigger (如果是踩著會有效果的格子，因為撞到障礙物而不動，應該要再觸發踩著的效果)
- 效果應該要根據什麼決定要存放在哪裡？
    - 公開的一定要顯示給所有人跟 host，私人的要給各個適合的人 ?
    - 根據觸發類型，執行時就按照階段把該類型 effect 拿出來一一執行 ?
        - 如果是「行為」或「位置」trigger 的 effect，可以存在 cell 或 item 上面
    - 跟據觸發效果的方向? 這個不太準確，只有「選擇」和「結果」可以這樣分，「行為」和「位置」因為技能、蟲子等外在因素，可能會觸發到跟原本預期不同的格子的效果
    - 靠「選擇」或「投票結果」觸發的效果，記錄在 state 上的 effects
- triggers 要被記進 state，要可以從 triggers 直接找回對應的行為 function
    - triggers 也可以改叫做 action effects
- save state
- incremental state (can also as action log)
- load state
- kick user
- highlight user (high frequency flash)

- willTrigger 其實就是在處理四個方向應該顯示什麼提示給使用者，完全是顯示在使用者裝置上的資訊
    - 所以他沒辦法表達所有的可能性，也不需要，只要能傳達我想呈現的資訊就好


## Features

- UI: 隱藏地圖外的格子
- 隱藏的分數
  - 要決定分數的用途，才能評價每個動作要拿幾分
  - 固定位置
    - 花 綠
    - 爐 紅
    - 書？ 藍
    - 椅？ 黃
    - 牆？
    - 空地
    - 戶外
    - 像？
  - 固定模式的
    - 在房間鞋子上觸發
    - 在大廳的柱子間觸發
    - 劍的四週？
    - 在餐廳的四個出口
    - 在冰箱觸發回頭的扣分
    - 在某個長路上擋住去路？
  - 隨機生成

  - 獎勵行動模式 (這比較像是隱藏小任務，可一開始就給各隊某個，也可以當獎勵兌換)
    - 持續前進
    - 每次轉彎
    - 每次折返
    - 停在原地
    - 跟大家選一樣的
    - 跟大家不同
- 隱藏的道具(好像至少要一種道具，才能測試)
  - 
- 發動投票
- 睡覺的床
- 發火的劍
- 移動的蟲
- 偷花的人
- 攻擊蟲
- 跳過牆壁
- 得到提示
- 顯示密碼按鈕
- 放下火鍋料
- 死掉復活的機制
